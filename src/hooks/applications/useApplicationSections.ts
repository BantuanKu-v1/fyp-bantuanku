import { useState } from "react";

type UseApplicationSectionsOptions = {
  confirmationExpanded?: boolean;
};

export default function useApplicationSections({
    confirmationExpanded = false
}: UseApplicationSectionsOptions = {}) {
  const [showApplicationDetails, setShowApplicationDetails] =
      useState(false);

  const [showApplicantDetails, setShowApplicantDetails] =
      useState(false);

  const [showReadiness, setShowReadiness] =
      useState(true);

  const [showPreliminaryEligibility, setShowPreliminaryEligibility] =
      useState(false);

  const [showConfirmationDetails, setShowConfirmationDetails] =
      useState(confirmationExpanded);

  return {
    showApplicationDetails,
    setShowApplicationDetails,
    showApplicantDetails,
    setShowApplicantDetails,
    showReadiness,
    setShowReadiness,
    showPreliminaryEligibility,
    setShowPreliminaryEligibility,
    showConfirmationDetails,
    setShowConfirmationDetails
  };
}
