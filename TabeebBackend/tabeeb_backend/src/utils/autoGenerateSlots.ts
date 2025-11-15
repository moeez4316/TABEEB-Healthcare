import prisma from '../lib/prisma';

/**
 * Auto-generate availability slots for doctors based on their weekly templates
 * This runs daily to ensure doctors always have slots for the next 30 days
 */
export const autoGenerateSlots = async () => {
  try {
    console.log('[Auto-Generate] Starting availability slot generation...');

    // Get all doctors with active weekly templates
    const templates = await (prisma as any).weeklyAvailabilityTemplate.findMany({
      where: {
        isActive: true
      },
      include: {
        breakTimes: true
      }
    });

    if (templates.length === 0) {
      console.log('[Auto-Generate] No active templates found');
      return;
    }

    // Group templates by doctor
    const doctorTemplates = new Map<string, any[]>();
    templates.forEach((template: any) => {
      if (!doctorTemplates.has(template.doctorUid)) {
        doctorTemplates.set(template.doctorUid, []);
      }
      doctorTemplates.get(template.doctorUid)!.push(template);
    });

    console.log(`[Auto-Generate] Found ${doctorTemplates.size} doctors with active templates`);

    let totalGenerated = 0;

    // Process each doctor
    for (const [doctorUid, activeDays] of doctorTemplates.entries()) {
      try {
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const futureDate = new Date(today);
        futureDate.setDate(futureDate.getDate() + 30);

        // Get dates that have appointments
        const appointmentsInRange = await prisma.appointment.findMany({
          where: {
            doctorUid,
            appointmentDate: {
              gte: today,
              lte: futureDate
            },
            status: {
              in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS']
            }
          },
          select: {
            appointmentDate: true
          }
        });

        const datesWithAppointments = new Set(
          appointmentsInRange.map(apt => apt.appointmentDate.toISOString().split('T')[0])
        );

        // Check existing availability
        const existingAvailability = await prisma.doctorAvailability.findMany({
          where: {
            doctorUid,
            date: {
              gte: today,
              lte: futureDate
            }
          }
        });

        const existingDates = new Set(
          existingAvailability.map(avail => avail.date.toISOString().split('T')[0])
        );

        // Generate slots for missing dates
        let generatedForDoctor = 0;

        for (let i = 0; i < 30; i++) {
          const targetDate = new Date(today);
          targetDate.setDate(targetDate.getDate() + i);
          const dayOfWeek = targetDate.getDay();

          const year = targetDate.getFullYear();
          const month = String(targetDate.getMonth() + 1).padStart(2, '0');
          const day = String(targetDate.getDate()).padStart(2, '0');
          const dateString = `${year}-${month}-${day}`;

          // Skip if already exists or has appointments
          if (existingDates.has(dateString) || datesWithAppointments.has(dateString)) {
            continue;
          }

          // Find template for this day
          const dayTemplate = activeDays.find((d: any) => d.dayOfWeek === dayOfWeek);

          if (dayTemplate) {
            // Create availability
            const availability = await prisma.doctorAvailability.create({
              data: {
                doctorUid,
                date: new Date(dateString),
                startTime: dayTemplate.startTime,
                endTime: dayTemplate.endTime,
                slotDuration: dayTemplate.slotDuration,
                isAvailable: true
              }
            });

            // Add break times
            if (dayTemplate.breakTimes && dayTemplate.breakTimes.length > 0) {
              await (prisma as any).doctorBreakTime.createMany({
                data: dayTemplate.breakTimes.map((bt: any) => ({
                  availabilityId: availability.id,
                  startTime: bt.startTime,
                  endTime: bt.endTime
                }))
              });
            }

            generatedForDoctor++;
          }
        }

        totalGenerated += generatedForDoctor;
        if (generatedForDoctor > 0) {
          console.log(`[Auto-Generate] Generated ${generatedForDoctor} slots for doctor ${doctorUid}`);
        }
      } catch (error) {
        console.error(`[Auto-Generate] Error generating slots for doctor ${doctorUid}:`, error);
      }
    }

    console.log(`[Auto-Generate] Completed! Generated ${totalGenerated} total slots`);
  } catch (error) {
    console.error('[Auto-Generate] Error in auto-generate process:', error);
  }
};

/**
 * Schedule auto-generation to run daily at 2 AM
 */
export const scheduleAutoGeneration = () => {
  // Run immediately on startup
  autoGenerateSlots();

  // Then run daily at 2 AM
  const HOUR_TO_RUN = 2; // 2 AM
  const checkInterval = 60 * 60 * 1000; // Check every hour

  setInterval(() => {
    const now = new Date();
    if (now.getHours() === HOUR_TO_RUN) {
      autoGenerateSlots();
    }
  }, checkInterval);

  console.log('[Auto-Generate] Scheduler initialized. Will run daily at 2:00 AM');
};
