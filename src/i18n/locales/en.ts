const en = {
  translation: {
    common: {
      back: "Back",
      continue: "Continue",
      done: "Done",
      close: "Close",
      cancel: "Cancel",
      ok: "OK",
      remove: "Remove",
      complete: "Complete",
      edit: "Edit",
      save: "Save",
      saving: "Saving...",
      discard: "Discard",
      keepEditing: "Keep Editing",

      retry: "Try Again",
      error: "Something went wrong",
      errorDescription: "We couldn't load this information. Please try again.",

      yes: "Yes",
      no: "No",
      notProvided: "Not provided",

      selectDate: "Select a date",
      selectOption: "Select an option",

      discardChanges: {
        title: "Discard changes?",
        message: "You have unsaved changes. If you leave now, your changes will be lost.",
      },
    },

    language: {
      title: "Language",
      english: "English",
      malay: "Bahasa Melayu",
      chinese: "中文",
    },

    auth: {
      common: {
        backToLogin: "Back to Login",
      },

      login: {
        title: "Welcome back",
        subtitle: "Sign in to continue to BantuanKu.",
        email: "Email",
        emailPlaceholder: "Enter your email",
        password: "Password",
        passwordPlaceholder: "Enter your password",
        forgotPassword: "Forgot password?",
        signIn: "Sign In",
        noAccount: "Don't have an account?",
        createAccount: "Create account",
        unableToSignIn: "Unable to sign in",

        errors: {
          invalidCredentials: "The email or password you entered is incorrect.",
          signInFailed: "Unable to sign in. Please try again.",
        },
      },

      forgotPassword: {
        title: "Forgot Password?",
        subtitle: "Enter your email address and we'll send you a link to reset your password.",
        sentSubtitle: "Check your email to continue resetting your password.",

        sendResetLink: "Send Reset Link",

        emailSent: "Reset Email Sent",
        emailSentDescription: "If an account exists for this email, a password reset link has been sent. Check your inbox to continue.",

        unableToSend: "Unable to Send Email",

        errors: {
          sendFailed: "We couldn't send the password reset email. Please try again.",
        },
      },

      resetPassword: {
        title: "Reset Password",
        subtitle: "Enter your new password below.",
        successSubtitle: "Your password has been updated successfully.",

        newPassword: "New Password",
        newPasswordPlaceholder: "Enter your new password",

        confirmPassword: "Confirm New Password",
        confirmPasswordPlaceholder: "Enter your new password again",

        resetPassword: "Reset Password",

        success: "Password Reset Successfully",
        successDescription: "Your password has been updated. You can now sign in with your new password.",

        unableToReset: "Unable to Reset Password",

        errors: {
          resetFailed: "We couldn't reset your password. Please try again.",
        },
      },

      register: {
        registering: "Creating your account...",
        registeringDescription: "Please wait while we set up your profile.",

        progress: {
          account: "Account",
          personal: "Personal",
          residence: "Residence",
          household: "Household",
          documents: "Documents",
        },

        account: {
          title: "Create Account",
          subtitle: "Create your account to get started.",

          email: "Email",
          emailPlaceholder: "Enter your email",

          password: "Password",
          passwordPlaceholder: "Use at least 8 characters.",

          confirmPassword: "Confirm Password",
          confirmPasswordPlaceholder: "Enter your password again",

          alreadyHaveAccount: "Already have an account?",
          signIn: "Sign in",
        },

        personal: {
          title: "Personal Details",
          subtitle: "Tell us about the person who will receive aid recommendations.",

          fullName: "Full Name",
          fullNamePlaceholder: "Enter full name",

          icNumber: "IC Number",
          icNumberPlaceholder: "XXXXXX-XX-XXXX",

          dateOfBirth: "Date of Birth",
          dobFromIc: "Automatically filled from your IC number.",

          citizenship: "Citizenship",
          selectCitizenship: "Select citizenship",
          malaysian: "Malaysian",
          nonMalaysian: "Non-Malaysian",

          mobileNumber: "Mobile Number",
          mobilePlaceholder: "012-3456789",
        },

        residence: {
          title: "Residence",
          subtitle: "Tell us where the person receiving aid currently lives.",

          addressLine1: "Address Line 1",
          addressLine1Placeholder: "House/unit number and street",

          addressLine2: "Address Line 2",
          addressLine2Placeholder: "Building, apartment or neighborhood",

          postcode: "Postcode",
          postcodePlaceholder: "e.g., 50000",

          city: "City",
          cityPlaceholder: "e.g., Kuala Lumpur",

          stateTerritory: "State / Federal Territory",
          selectStateTerritory: "Select state or Federal Territory",

          locationAutoHelper: "City and state are automatically filled based on your postcode.",
          locationManualHelper: "We couldn't retrieve your location. Please enter your city and state manually.",
        },

        householdIncome: {
          title: "Household & Income",
          subtitle: "Tell us about the aid recipient's household and income.",

          employmentStatus: "Employment Status",
          selectEmploymentStatus: "Select employment status",

          employmentStatusOptions: {
            employed: "Employed",
            selfEmployed: "Self-employed",
            unemployed: "Unemployed",
            retired: "Retired",
            homemaker: "Homemaker",
            notWorking: "Not working",
          },

          incomeSource: "Income Source",
          selectIncomeSource: "Select income source",

          incomeSourceOptions: {
            salary: "Salary",
            selfEmployment: "Self-employment",
            pension: "Pension",
            governmentAssistance: "Government assistance",
            familySupport: "Family support",
            savings: "Savings",
            other: "Other",
            noIncome: "No income",
          },

          personalMonthlyIncome: "Personal Monthly Income (RM)",
          householdMonthlyIncome: "Gross Monthly Household Income (RM)",

          householdMembers: "Household Members",
          householdMembersHelper: "Add other people who live in the same household as the aid recipient.",

          householdMember: "Household Member {{number}}",

          memberFullName: "Full Name",
          memberFullNamePlaceholder: "Enter household member's full name",

          relationship: "Relationship",
          selectRelationship: "Select relationship",

          relationshipOptions: {
            spouse: "Spouse",
            child: "Child",
            parent: "Parent",
            sibling: "Sibling",
            grandchild: "Grandchild",
            other: "Other",
          },

          memberDateOfBirth: "Date of Birth",

          addHouseholdMember: "Add Household Member",
          removeHouseholdMember: "Remove household member",

          livingAloneHelper: "If the aid recipient lives alone, you do not need to add a household member.",

          removeMemberDialog: {
            title: "Remove household member?",
            message: "The information entered for this household member will be removed.",
          },
        },

        documents: {
          title: "Supporting Documents",
          subTitle: "Upload documents you already have to make future aid applications easier.",

          optional: "Documents are optional. You can add or update them later from your profile.",

          identity: {
            title: "Identification Document",
            description: "MyKad, MyPR or other identification document",
          },

          income: {
            title: "Income Document",
            description: "Payslip, employer income statement or income declaration",
          },

          address: {
            title: "Proof of Address",
            description: "Utility bill showing your residential address",
          },

          bank: {
            title: "Bank Account Proof",
            description: "Bank statement or bank account verification",
          },

          upload: "Upload",
          addAnother: "Add another",
          replace: "Replace",
          fileRequirements: "PDF, JPG or PNG • Maximum 10 MB per file",

          error: {
            title: "Document Error",
            invalidFileType: "Please select a PDF, JPG or PNG file.",
            fileTooLarge: "The selected file must be 10 MB or smaller.",
            selectionFailed: "Unable to select this document. Please try again.",
          },
        },

        errors: {
          title: "Unable to complete registration",
          incompleteRegistration: "Some registration information is missing. Please review the previous steps.",
          languageUnavailable: "Unable to determine your preferred language.",
          registrationFailed: "Registration could not be completed. Please try again.",
          identificationNumberExists: "This IC number is already registered.",
        },
      },
    },

    profile: {
      title: "Profile",
      description: "Manage your personal and household information.",

      sections: {
        personal: "Personal",
        household: "Household",
        residence: "Residence",
        preferences: "Preferences",
        account: "Account",
      },

      personalInformation: {
        title: "Personal Information",
        description: "Personal and demographic information",

        personalDetails: "Personal Details",
        contact: "Contact",

        fullName: "Full Name",
        identificationNumber: "IC Number",
        dateOfBirth: "Date of Birth",
        gender: "Gender",
        citizenship: "Citizenship",
        mobileNumber: "Mobile Number",

        male: "Male",
        female: "Female",

        malaysian: "Malaysian",
        nonMalaysian: "Non-Malaysian",

        maritalStatus: "Marital Status",
        homePhone: "Home Phone",

        personalCircumstances: "Personal Circumstances",
        financialInformation: "Financial Information",
        studentStatus: "Student Status",
        okuStatus: "OKU Status",

        updateCircumstancesFailed: "Unable to update your personal circumstances. Please try again.",
        updateFinancialFailed: "Unable to update your financial information. Please try again.",
        updateHomePhoneFailed: "Unable to update your home phone number. Please try again.",
      },

      household: {
        title: "My Household",
        youOnly: "You only",
        oneMember: "You + 1 household member",
        multipleMembers: "You + {{count}} household members",

        members: "Household Members",
        addMember: "Add Household Member",
        editMember: "Edit Household Member",
        completeInformation: "Complete missing information",
        missingInformation: "Missing",
        moreFields: "+{{count}} more",

        empty: {
          title: "No Household Members",
          description: "Add people who live in the same household as you.",
        },

        loadError: {
          title: "Unable to Load Household Member",
          description: "We couldn't load this household member's information. Please try again.",
        },

        relationship: {
          spouse: "Spouse",
          child: "Child",
          parent: "Parent",
          sibling: "Sibling",
          grandchild: "Grandchild",
          other: "Other",
        },

        member: {
          fullName: "Full Name",
          relationship: "Relationship",
          dateOfBirth: "Date of Birth",
        },

        add: {
          selectRelationship: "Select relationship",

          sections: {
            basicInformation: "Basic Information",
            employmentIncome: "Employment & Education",
            education: "Education",
            disability: "Disability / OKU",
          },

          fields: {
            citizenship: "Citizenship",
            identificationNumber: "IC / Identification Number",
            gender: "Gender",
            isDependent: "Is this person financially dependent on you?",
            employmentStatus: "Employment Status",
            occupation: "Occupation",
            monthlyIncome: "Monthly Income (RM)",
            isStudent: "Is this person currently a student?",
            studyMode: "Study Mode",
            institutionType: "Institution Type",
            isOku: "Is this person a Person with Disabilities (OKU)?",
            okuRegistered: "Is this person registered as OKU?",
          },

          options: {
            male: "Male",
            female: "Female",
            malaysian: "Malaysian",
            nonMalaysian: "Non-Malaysian",

            employed: "Employed",
            selfEmployed: "Self-employed",
            unemployed: "Unemployed",
            retired: "Retired",
            homemaker: "Homemaker",
            notWorking: "Not working",

            fullTime: "Full-time",
            partTime: "Part-time",

            school: "School",
            ipta: "IPTA",
            ipts: "IPTS",
            other: "Other",
          },

          errorTitle: "Unable to Add Household Member",
          errorDescription: "We couldn't save this household member. Please try again.",
        },

        edit: {
          errorTitle: "Unable to Update Household Member",
          errorDescription: "We couldn't update this household member. Please try again.",
        },

        confirmation: {
          title: "Household Confirmation",
          description: "Please review your household members and confirm that everyone has been listed, including if you live alone. You can still add or edit household members after confirmation, but you will need to confirm again.",
          confirmed: "Household information confirmed.",
          agreement: "I confirm that my household member information is complete and accurate.",
          button: "Confirm Household Information",
        },
      },

      incomeEmployment: {
        title: "Income & Employment",
        noInformation: "Employment information",

        status: {
          employed: "Employed",
          selfEmployed: "Self-employed",
          unemployed: "Unemployed",
          retired: "Retired",
          notWorking: "Not working",
        },
      },

      residentialAddress: {
        title: "Residential Address",
        noAddress: "No address provided",
        country: "Country",
      },

      language: {
        title: "Language",

        selectLanguageTitle: "Select Language",
        selectLanguageDescription: "Choose the language you would like to use.",
      },

      account: {
        signOut: "Sign Out",
        signOutDescription: "Are you sure you want to sign out of your account?",
      },

      errors: {
        loadTitle: "Unable to load profile",
        loadDescription: "We couldn't load your profile information.",
        tryAgain: "Try Again",
      },
    },

    applications: {
      title: "My Applications",
      description: "Track your submitted aid applications and their latest status.",

      totalApplications: "Total Applications",
      myApplications: "Application History",

      status: "Application Status",
      lastUpdated: "Last Updated",

      statuses: {
        draft: "Draft",
        inProgress: "In Progress",
        readyForReview: "Ready for Review",
        submitted: "Submitted",
        underReview: "Under Review",
        additionalInformationRequired: "Additional Information Required",
        approved: "Approved",
        rejected: "Rejected",
        cancelled: "Cancelled",
      },

      submissionState: {
        pending: "Submission Pending",
        failed: "Submission Failed",
        unknown: "Submission Unknown",
      },

      empty: {
        title: "No Applications Yet",
        description:
            "You haven't submitted any aid applications yet. Once you submit an application, you can track its status here.",
      },

      errors: {
        loadTitle: "Unable to Load Applications",
        loadDescription:
            "We couldn't retrieve your applications. Please check your connection and try again.",
      },

      str: {
        title: "STR Application",
        description: "Review your information before submitting your STR application.",

        sections: {
          applicationDetails: "Application Details",
          applicantInformation: "Applicant Information",
          applicationReadiness: "Application Readiness",
          submissionConfirmation: "Submission Confirmation",
        },

        fields: {
          program: "Aid Program",
          agency: "Agency",
          applicationId: "Application ID",
          status: "Application Status",
          fullName: "Full Name",
          identificationNo: "IC Number",
          dateOfBirth: "Date of Birth",
          citizenship: "Citizenship",
          referenceNo: "Reference Number",
          providerApplicationId: "STR Application ID",
          providerStatus: "STR Status",
          submittedAt: "Submitted At",
        },

        readiness: {
          applicant: "Applicant Information",
          address: "Residential Address",
          household: "Household Information",
          householdMembers: "Household Members",
          complete: "Complete",
          incomplete: "Incomplete",
        },

        buttons: {
          submit: "Submit STR Application",
          alreadySubmitted: "Application Submitted",
          refresh: "Refresh Information",
          cancel: "Cancel",
          confirm: "Confirm Submission",
        },

        messages: {
          loading: "Loading your STR application...",
          loadError: "Unable to load your STR application. Please try again.",
          notProvided: "Not provided",
          notAvailable: "Not available",
          attentionRequired: "Attention Required",
          missingInformation: "Complete the missing information in your profile before submitting.",
          confirmTitle: "Submit STR Application?",
          confirmDescription: "Please confirm that your information is accurate before submitting your application to STR.",
          successTitle: "Application Submitted",
          successDescription: "Your STR application was submitted successfully. Reference number: {{referenceNo}}",
          submissionError: "Unable to submit your STR application. Please try again.",
          alreadySubmittedTitle: "Application Already Submitted",
          alreadySubmittedDescription: "Your STR application has already been submitted. You do not need to submit it again.",
          existingConfirmation: "This is the confirmation from your previous submission.",
          submissionUncertain: "We could not confirm whether STR received your application. Refresh and check its status before trying again.",
          invalidConfirmation: "The STR service returned an invalid submission confirmation. Please check your application status.",
        },
      },
    },

    eligibility: {
      questionnaire: {
        title: "{{programCode}} Eligibility Questionnaire",
        subtitle: "A few additional details will help us assess your preliminary eligibility.",

        loading: "Loading your questionnaire...",

        yourProgress: "Your Progress",
        reviewProgress: "Review Your Answers",

        answeredCount: "{{answered}} of {{total}} answered",
        questionCount: "Question {{current}} of {{total}}",

        required: "Required",
        optional: "Optional",

        numberPlaceholder: "Enter a number",
        amountPlaceholder: "Enter amount (RM)",
        countPlaceholder: "Enter a whole number",

        numberHint: "Enter a valid non-negative number.",
        dateHint: "Use the format YYYY-MM-DD.",

        reviewTitle: "Review Your Answers",
        reviewDescription: "Please check your answers before saving.",

        reviewAnswers: "Review Answers",
        saveAnswers: "Save Answers",

        editAnswer: "Edit {{question}}",

        noQuestions: "No additional questions are currently required.",
        unknownSelection: "Unknown selection",

        disclaimer: "Your answers are used for preliminary eligibility assessment only and do not guarantee government approval.",

        validation: {
          boolean: "Please select Yes or No.",
          select: "Please select an available option.",
          number: "Enter a valid number.",
          nonNegative: "Negative values are not allowed.",
          integer: "Enter a whole number.",
          decimalPlaces: "Enter no more than {{count}} decimal places.",
          min: "The minimum allowed value is {{min}}.",
          max: "The maximum allowed value is {{max}}.",
          date: "Enter a valid date in YYYY-MM-DD format.",
          futureDate: "Future dates are not allowed.",
        },

        errors: {
          loadFailed: "Unable to load your questionnaire. Please try again.",
          saveFailed: "Unable to save your answers. Please try again.",
        },

        questions: {
          BAT: {
            bat_target_group: {
              label: "Are you part of a JKM target group?",
              description: "Select your known status. JKM may need to verify this.",
            },

            bat_recommendation: {
              label: "Do you have a recommendation from a medical professional or JKM?",
            },

            bat_equipment: {
              label: "Are you requesting assistive equipment?",
            },

            bat_equipment_cost: {
              label: "What is the estimated equipment cost (RM)?",
              description: "Enter an estimate if known. You may leave it unanswered.",
            },
          },

          BPT: {
            bpt_role: {
              label: "Are you applying as a patient or caregiver?",
              options: {
                patient: "Patient",
                caregiver: "Caregiver",
              },
            },

            bpt_patient_citizenship: {
              label: "Is the patient a Malaysian citizen?",
            },

            bpt_patient_residence: {
              label: "Does the patient currently reside in Malaysia?",
            },

            bpt_patient_oku: {
              label: "Is the patient a person with disabilities (OKU)?",
            },

            bpt_chronic_illness: {
              label: "Does the patient have a chronic illness?",
            },

            bpt_bedridden: {
              label: "Is the patient bedridden?",
            },

            bpt_continuous_treatment: {
              label: "Does the patient require continuous treatment?",
            },

            bpt_treatment_start: {
              label: "When did continuous treatment begin?",
            },

            bpt_has_caregiver: {
              label: "Does the patient have a caregiver?",
            },

            bpt_caregiver_citizenship: {
              label: "Is the caregiver a Malaysian citizen?",
            },

            bpt_intensive_care: {
              label: "Does the caregiver provide intensive care?",
            },
          },
        },
      },
    },

    validation: {
      required: "This field is required.",

      emailRequired: "Email is required.",
      emailInvalid: "Enter a valid email address.",

      passwordRequired: "Password is required.",
      passwordTooShort: "Password must contain at least 8 characters.",

      confirmPasswordRequired: "Please confirm your password.",
      passwordMismatch: "Passwords do not match.",

      fullNameRequired: "Full name is required.",

      myKadNumberRequired: "IC number is required.",
      myKadNumberInvalid: "Enter a valid IC number.",

      dateOfBirthRequired: "Date of birth is required.",
      dateOfBirthInvalid: "Enter a valid date of birth.",
      dateOfBirthMismatch: "Date of birth does not match the IC number.",

      citizenshipRequired: "Citizenship is required.",

      mobileNumberRequired: "Mobile number is required.",
      mobileNumberInvalid: "Enter a valid Malaysian mobile number.",

      addressLine1Required: "Address line 1 is required.",

      postcodeRequired: "Postcode is required.",
      postcodeInvalid: "Enter a valid 5-digit postcode.",

      cityRequired: "City is required.",
      stateTerritoryRequired: "State/Territory is required.",

      employmentStatusRequired: "Employment status is required.",

      incomeSourceRequired: "Income source is required.",
      personalMonthlyIncomeRequired: "Personal monthly income is required.",
      householdMonthlyIncomeRequired: "Gross monthly household income is required.",
      monthlyIncomeInvalid: "Enter a valid monthly income.",

      householdMemberNameRequired: "Household member's name is required.",
      relationshipRequired: "Relationship is required.",
      householdMemberDobRequired: "Household member's date of birth is required.",

      identificationNumberInvalid: "Enter a valid identification number.",
    },
  },
};

export default en;
