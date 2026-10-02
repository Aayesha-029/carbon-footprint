package com.ecotrack.carbon.exception;

/**
 * Thrown when the emission calculation engine cannot find a matching
 * emission_factors row for the given category/activity_type/unit combination.
 */
public class UnknownActivityTypeException extends RuntimeException {

    public UnknownActivityTypeException(String category, String activityType, String unit) {
        super(String.format(
                "No emission factor found for category='%s', activityType='%s', unit='%s'. " +
                "Check that the activity type and unit are supported and spelled correctly.",
                category, activityType, unit));
    }

    public UnknownActivityTypeException(String message) {
        super(message);
    }
}