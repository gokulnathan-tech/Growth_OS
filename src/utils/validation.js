// ===============================
// KaniTreePlanner Validation
// ===============================

// Name Validation
export function validateName(name) {
  return name.trim().length > 0;
}

// Nominee Validation
export function validateNominee(nominee) {
  return nominee.trim().length > 0;
}

// ID Validation
export function isValidIdNumber(idNumber) {

  // Empty = Pending
  if (idNumber.trim() === "") {
    return true;
  }

  return /^\d{10}$/.test(idNumber);
}

// Error Message
export function getIdError(idNumber) {

  if (idNumber.trim() === "") {
    return "";
  }

  if (!/^\d+$/.test(idNumber)) {
    return "Only numbers are allowed.";
  }

  if (idNumber.length !== 10) {
    return "ID Number must be exactly 10 digits.";
  }

  return "";
}