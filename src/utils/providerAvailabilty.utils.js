const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);

  return hours * 60 + minutes;
};

const minutesToTime = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
};

const generateSlots = ({
  startTime,
  endTime,
  duration,
  interval = 30,
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

export {
  timeToMinutes,
  minutesToTime,
  generateSlots,
};