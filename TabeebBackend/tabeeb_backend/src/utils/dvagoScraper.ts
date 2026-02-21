import axios from 'axios';
import * as cheerio from 'cheerio';

/**
 * Represents a single product scraped from dvago.pk.
 * Data is extracted from the __NEXT_DATA__ JSON embedded in SSR pages.
 */
export interface DvagoProduct {
  productId: string;
  title: string;          // e.g. "Panadol Tablets 500Mg (1 Strip = 10 Tablets)"
  brand: string;          // e.g. "HALEON"
  price: number;          // MRP (e.g. 36.352)
  discountPrice: number;  // discounted price (e.g. 34.5)
  packInfo: string;       // e.g. "1 Strip = 10 Tablets"
  category: string;       // e.g. "Medicine"
  usedFor: string;        // e.g. "Fever Relief"
  prescriptionRequired: boolean;
  slug: string;           // e.g. "panadol-500mg-tablets"
  url: string;            // full URL
  description: string;
}

/** Raw product shape from dvago.pk __NEXT_DATA__ */
interface DvagoRawProduct {
  ProductID: string;
  Slug: string;
  Title: string;
  Brand: string;
  Price: string;
  DiscountPrice: string;
  Category: string;
  Usedfor: string;
  PrescriptionRequired: string;
  Description: string;
  VariationTitle: string;
  TotalTablets: string;
}

const DVAGO_BASE = 'https://www.dvago.pk';
const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// ──────────────────────────────────────────────
// Core: extract products from __NEXT_DATA__ JSON
// ──────────────────────────────────────────────
const extractProductsFromHtml = (html: string): DvagoRawProduct[] => {
  const $ = cheerio.load(html);
  const scriptTag = $('script#__NEXT_DATA__').html();
  if (!scriptTag) return [];

  try {
    const nextData = JSON.parse(scriptTag);
    const data =
      nextData?.props?.pageProps?.dehydratedState?.queries?.[0]?.state?.data?.Data;
    if (Array.isArray(data)) return data as DvagoRawProduct[];
  } catch {
    // JSON parse failed — page structure may have changed
  }
  return [];
};

const mapRawProduct = (raw: DvagoRawProduct): DvagoProduct => ({
  productId: raw.ProductID,
  title: raw.Title,
  brand: raw.Brand || 'Unknown',
  price: parseFloat(raw.Price) || 0,
  discountPrice: parseFloat(raw.DiscountPrice) || 0,
  packInfo: extractPackInfo(raw.Title),
  category: raw.Category || '',
  usedFor: raw.Usedfor || '',
  prescriptionRequired: raw.PrescriptionRequired === 'True',
  slug: raw.Slug,
  url: `${DVAGO_BASE}/p/${raw.Slug}`,
  description: raw.Description || '',
});

/** Pull pack info from the parenthesised section of the title, e.g. "(1 Strip = 10 Tablets)" */
const extractPackInfo = (title: string): string => {
  const match = title.match(/\(([^)]+)\)/);
  return match ? match[1] : '';
};

// ──────────────────────────────────────────────
// Scrape a single A-to-Z letter page (with pagination)
// ──────────────────────────────────────────────
const scrapeLetterPage = async (
  letter: string,
  maxPages: number = 3
): Promise<DvagoProduct[]> => {
  const allProducts: DvagoProduct[] = [];

  for (let page = 1; page <= maxPages; page++) {
    try {
      const url =
        page === 1
          ? `${DVAGO_BASE}/atozmedicine/${letter.toUpperCase()}`
          : `${DVAGO_BASE}/atozmedicine/${letter.toUpperCase()}?page=${page}`;

      const { data: html } = await axios.get(url, {
        headers: { 'User-Agent': USER_AGENT },
        timeout: 12000,
      });

      const raw = extractProductsFromHtml(html);
      if (raw.length === 0) break; // no more pages

      allProducts.push(...raw.map(mapRawProduct));

      // If we got fewer than 16 items, it's the last page
      if (raw.length < 16) break;
    } catch (err: any) {
      console.warn(
        `[Dvago Scraper] Failed letter="${letter}" page=${page}:`,
        err.message
      );
      break;
    }
  }

  return allProducts;
};

// ──────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────

/**
 * Search dvago.pk for products matching a medicine name and optional alternative names.
 *
 * Strategy:
 * 1. Determine the first letter of each search term
 * 2. Scrape those A-to-Z letter pages (paginated)
 * 3. Fuzzy-match product names against all search terms
 */
export const searchDvago = async (
  query: string,
  alternativeNames: string[] = []
): Promise<DvagoProduct[]> => {
  // Collect unique first letters to scrape
  const lettersToScrape = new Set<string>();
  const addLetter = (name: string) => {
    const ch = name.trim().charAt(0).toUpperCase();
    if (/[A-Z]/.test(ch)) lettersToScrape.add(ch);
  };

  addLetter(query);
  alternativeNames.forEach(addLetter);

  // Cap at 6 letters to keep response time reasonable
  const letters = Array.from(lettersToScrape).slice(0, 6);
  console.log(
    `[Dvago Scraper] Scraping letters: ${letters.join(', ')} for query: "${query}"`
  );

  // Scrape all letter pages in parallel (max 2 pages each to stay fast)
  const results = await Promise.all(letters.map((l) => scrapeLetterPage(l, 2)));
  const allProducts = results.flat();

  console.log(`[Dvago Scraper] Total products scraped: ${allProducts.length}`);

  // Build search terms — normalise to lowercase
  const searchTerms = [
    query.toLowerCase().trim(),
    ...alternativeNames.map((n) => n.toLowerCase().trim()),
  ];

  // Fuzzy-match product names
  const matched = allProducts.filter((product) => {
    const pName = product.title.toLowerCase();
    return searchTerms.some((term) => {
      // direct substring match (either direction)
      if (pName.includes(term) || term.includes(pName.split(/\s/)[0])) return true;
      // first-word brand matching
      const productBrand = pName.split(/\s+/)[0];
      if (term.includes(productBrand) || productBrand.includes(term.split(/\s+/)[0])) return true;
      return false;
    });
  });

  // Deduplicate by productId
  const seen = new Set<string>();
  const unique = matched.filter((p) => {
    if (seen.has(p.productId)) return false;
    seen.add(p.productId);
    return true;
  });

  console.log(`[Dvago Scraper] Matched products: ${unique.length}`);
  return unique;
};

/**
 * Format scraped products into a text block the LLM can use to build a response.
 */
export const formatDvagoResults = (products: DvagoProduct[]): string => {
  if (products.length === 0) return '';

  const lines = products.map(
    (p, i) =>
      `${i + 1}. "${p.title}" | Brand: ${p.brand} | MRP: Rs. ${p.price.toFixed(2)} | Discounted: Rs. ${p.discountPrice.toFixed(2)} | Pack: ${p.packInfo || 'N/A'} | Used for: ${p.usedFor || 'N/A'} | Rx Required: ${p.prescriptionRequired ? 'Yes' : 'No'} | URL: ${p.url}`
  );

  return [
    'REAL-TIME VERIFIED PRICE DATA FROM DVAGO.PK (Pakistan\'s largest online pharmacy):',
    '(These prices were scraped just now and are current)',
    '',
    ...lines,
  ].join('\n');
};
