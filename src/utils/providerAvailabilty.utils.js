const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
};

const minutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const SLOT_INTERVAL = 30;

const generateSlots = ({
  startTime,
  endTime,
  duration,
  interval = SLOT_INTERVAL,
}) => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  const slots = [];

  for (
    let current = startMinutes;
    current + duration <= endMinutes;
    current += interval
  ) {
    slots.push({
      startTime: minutesToTime(current),
      endTime: minutesToTime(current + duration),
    });
  }

  return slots;
};

const generateBookingSlots = ({
  startTime,
  duration,
}) => {
  const slots = [];

  const totalSlots = Math.ceil(
    duration / SLOT_INTERVAL
  );

  for (let i = 0; i < totalSlots; i++) {
    const slotStart = new Date(
      startTime.getTime() +
        i * SLOT_INTERVAL * 60 * 1000
    );

    const slotEnd = new Date(
      slotStart.getTime() +
        SLOT_INTERVAL * 60 * 1000
    );

    slots.push({
      slotStart,
      slotEnd,
    });
  }

  return slots;
};


export {
  timeToMinutes,
  minutesToTime,
  generateSlots,
  SLOT_INTERVAL,
  generateBookingSlots,
};