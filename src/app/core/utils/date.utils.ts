export function toIsoUtcString(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString();


  console.log("mudando data de " + date + "para" + d) //<-------------------


}