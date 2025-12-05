import NiceModal from "@ebay/nice-modal-react";
import LogoutConfirmModal from "./LogoutConfirmModal";
import EditEmployeeModal from "./employees/EditEmployeeModal";
import AddEmployeeModal from "./employees/AddEmployeeModal";
import MoveToRentModal from "./rent/MoveToRentModal";
import EditRentModal from "./rent/EditRentModal";
import DeleteAdModal from "./ad/DeleteAdModal";
import EditRentDataModal from "./rent/EditRentDataModal";
import EmailOTPModal from "./profile/EmailOTPModal";
import PasswordOTPModal from "./profile/PasswordOTPModal";

NiceModal.register("logout-confirm-modal", LogoutConfirmModal);
NiceModal.register("edit-employee-modal", EditEmployeeModal);
NiceModal.register("add-employee-modal", AddEmployeeModal);
NiceModal.register("move-to-rent-modal", MoveToRentModal);
NiceModal.register("edit-rent-modal", EditRentModal);
NiceModal.register("delete-ad-modal", DeleteAdModal);
NiceModal.register("email-otp-modal", EmailOTPModal);
NiceModal.register("password-otp-modal", PasswordOTPModal);