
export const getNumberWithSpaces = (nb: number, float?: boolean) => {
  if (float && nb) {
    const intValue = Math.floor(nb).toString();
    let withSpaces = intValue.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    const decimalValue = (nb + "").split(".")[1];
    if (decimalValue !== undefined) {
      withSpaces += "." + decimalValue.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }
    return withSpaces;
  } else {
    return nb.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }
};

export const getNumberWithSpacesFromString = (nb: string, float?: boolean) => {
  if (float && nb) {
    const intValue = Math.floor(parseFloat(nb)).toString();
    let withSpaces = intValue.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    const decimalValue = (nb + "").split(".")[1];
    if (decimalValue !== undefined) {
      withSpaces += "." + decimalValue.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
    }
    return withSpaces;
  } else {
    return nb.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  }
};
