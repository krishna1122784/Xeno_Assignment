package org.example.utils;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

public class ValidationEngine {

    // Dynamic Validation Router for Phone Formats (IN vs SG)
    public static boolean isValidPhone(String phone, String countryCode) {
        if (phone == null || phone.trim().isEmpty()) return false;
        String cleanPhone = phone.replaceAll("[\\s\\-()]", "");

        switch (countryCode.toUpperCase()) {
            case "IN": // India Compliance: 10 digits starting with 6-9
                return cleanPhone.matches("^[6-9]\\d{9}$");
            case "SG": // Singapore Compliance: 8 digits starting with 8 or 9
                return cleanPhone.matches("^[89]\\d{7}$");
            default:
                return cleanPhone.matches("^\\d{8,15}$");
        }
    }

    // Fixed: Handles date validation matching your exact CSV format (DD-MM-YYYY)
    public static boolean isValidDate(String dateStr) {
        if (dateStr == null || dateStr.trim().isEmpty()) return false;
        try {
            // Aapki Excel format ke sath perfect synchronization ke liye code update:
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy");
            LocalDate.parse(dateStr.trim(), formatter);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}