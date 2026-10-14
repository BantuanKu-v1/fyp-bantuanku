const zh = {
  translation: {
    common: {
      back: "返回",
      continue: "继续",
      done: "完成",
      close: "关闭",
      cancel: "取消",
      ok: "确定",
      remove: "移除",
      complete: "完成",
      edit: "编辑",
      save: "保存",
      saving: "正在保存...",
      discard: "放弃",
      keepEditing: "继续编辑",

      retry: "重试",
      error: "发生错误",
      errorDescription: "无法加载此信息，请重试。",

      yes: "是",
      no: "否",
      notProvided: "未提供",

      selectDate: "选择日期",
      selectOption: "请选择",

      discardChanges: {
        title: "放弃更改？",
        message: "您有尚未保存的更改。如果现在离开，这些更改将会丢失。",
      },
    },

    language: {
      title: "语言",
      english: "English",
      malay: "Bahasa Melayu",
      chinese: "中文",
    },

    auth: {
      common: {
        backToLogin: "返回登录",
      },

      login: {
        title: "欢迎回来",
        subtitle: "登录以继续使用 BantuanKu。",
        email: "电子邮箱",
        emailPlaceholder: "请输入电子邮箱",
        password: "密码",
        passwordPlaceholder: "请输入密码",
        forgotPassword: "忘记密码？",
        signIn: "登录",
        noAccount: "还没有账号？",
        createAccount: "创建账号",
        unableToSignIn: "无法登录",

        errors: {
          invalidCredentials: "您输入的电子邮箱或密码不正确。",
          signInFailed: "无法登录，请重试。",
        },
      },

      forgotPassword: {
        title: "忘记密码？",
        subtitle: "请输入您的电子邮箱地址，我们将发送密码重置链接给您。",
        sentSubtitle: "请查看您的电子邮箱以继续重置密码。",

        sendResetLink: "发送重置链接",

        emailSent: "重置邮件已发送",
        emailSentDescription: "如果此电子邮箱已注册账户，密码重置链接将发送至该邮箱。请查看收件箱以继续。",

        unableToSend: "无法发送邮件",

        errors: {
          sendFailed: "无法发送密码重置邮件，请重试。",
        },
      },

      resetPassword: {
        title: "重置密码",
        subtitle: "请在下方输入您的新密码。",
        successSubtitle: "您的密码已成功更新。",

        newPassword: "新密码",
        newPasswordPlaceholder: "请输入新密码",

        confirmPassword: "确认新密码",
        confirmPasswordPlaceholder: "请再次输入新密码",

        resetPassword: "重置密码",

        success: "密码重置成功",
        successDescription:
            "您的密码已更新。现在您可以使用新密码登录。",

        unableToReset: "无法重置密码",

        errors: {
          resetFailed: "无法重置您的密码，请重试。",
        },
      },

      register: {
        registering: "正在创建您的账户...",
        registeringDescription: "请稍后，我们正在为您设置个人资料。",

        progress: {
          account: "账户",
          personal: "个人",
          residence: "住址",
          household: "家庭",
          documents: "文件",
        },

        account: {
          title: "创建账号",
          subtitle: "创建您的账号以开始使用。",

          email: "电子邮箱",
          emailPlaceholder: "请输入电子邮箱",

          password: "密码",
          passwordPlaceholder: "至少使用 8 个字符。",

          confirmPassword: "确认密码",
          confirmPasswordPlaceholder: "请再次输入密码",

          alreadyHaveAccount: "已有账号？",
          signIn: "登录",
        },

        personal: {
          title: "个人资料",
          subtitle: "请填写将接受援助推荐者的个人资料。",

          fullName: "姓名",
          fullNamePlaceholder: "请输入姓名",

          icNumber: "身份证号码",
          icNumberPlaceholder: "XXXXXX-XX-XXXX",

          dateOfBirth: "出生日期",
          dobFromIc: "会根据您的身份证号码自动填写。",

          citizenship: "国籍",
          selectCitizenship: "选择国籍",
          malaysian: "马来西亚公民",
          nonMalaysian: "非马来西亚公民",

          mobileNumber: "手机号码",
          mobilePlaceholder: "012-3456789",
        },

        residence: {
          title: "居住地址",
          subtitle: "请填写援助领取者目前的居住地址。",

          addressLine1: "地址第一行",
          addressLine1Placeholder: "门牌／单位号码及街道",

          addressLine2: "地址第二行",
          addressLine2Placeholder: "建筑、公寓或住宅区",

          postcode: "邮政编码",
          postcodePlaceholder: "例如：50000",

          city: "城市",
          cityPlaceholder: "例如：Kuala Lumpur",

          stateTerritory: "州属／联邦直辖区",
          selectStateTerritory: "选择州属或联邦直辖区",

          locationAutoHelper: "城市和州属将根据您的邮政编码自动填写。",
          locationManualHelper: "无法获取您的位置信息，请手动填写城市和州属。"
        },

        householdIncome: {
          title: "家庭与收入",
          subtitle: "请填写援助领取者的家庭及收入资料。",

          employmentStatus: "就业状态",
          selectEmploymentStatus: "选择就业状态",

          employmentStatusOptions: {
            employed: "受雇",
            selfEmployed: "自雇",
            unemployed: "失业",
            retired: "退休",
            homemaker: "家庭主妇／主夫",
            notWorking: "没有工作",
          },

          incomeSource: "收入来源",
          selectIncomeSource: "选择收入来源",

          incomeSourceOptions: {
            salary: "薪资",
            selfEmployment: "自雇收入",
            pension: "退休金",
            governmentAssistance: "政府援助",
            familySupport: "家庭资助",
            savings: "储蓄",
            other: "其他",
            noIncome: "无收入",
          },

          personalMonthlyIncome: "个人每月收入（RM）",
          householdMonthlyIncome: "家庭每月总收入（RM）",

          householdMembers: "家庭成员",
          householdMembersHelper:
              "添加与援助领取者居住在同一家庭的其他成员。",

          householdMember: "家庭成员 {{number}}",

          memberFullName: "姓名",
          memberFullNamePlaceholder: "输入家庭成员的姓名",

          relationship: "关系",
          selectRelationship: "选择关系",

          relationshipOptions: {
            spouse: "配偶",
            child: "子女",
            parent: "父母",
            sibling: "兄弟姐妹",
            grandchild: "孙子女",
            other: "其他",
          },

          memberDateOfBirth: "出生日期",

          addHouseholdMember: "添加家庭成员",
          removeHouseholdMember: "移除家庭成员",

          livingAloneHelper:
              "如果援助领取者独居，则无需添加家庭成员。",

          removeMemberDialog: {
            title: "移除家庭成员？",
            message: "为此家庭成员填写的资料将会被移除。",
          },
        },

        documents: {
          title: "辅助文件",
          subTitle: "上传您已有的文件，让日后的援助申请更加方便。",

          optional:
              "文件为选填项目。您可以稍后在个人资料中添加或更新文件。",

          identity: {
            title: "身份证明文件",
            description: "MyKad、MyPR 或其他身份证明文件",
          },

          income: {
            title: "收入证明文件",
            description: "工资单、雇主收入证明或收入声明",
          },

          address: {
            title: "地址证明",
            description: "显示您居住地址的水电费账单",
          },

          bank: {
            title: "银行账户证明",
            description: "银行结单或银行账户证明",
          },

          upload: "上传",
          addAnother: "继续添加",
          replace: "替换",

          fileRequirements: "PDF、JPG 或 PNG • 每个文件最大 10 MB",

          error: {
            title: "文件错误",
            invalidFileType: "请选择 PDF、JPG 或 PNG 文件。",
            fileTooLarge: "所选文件大小不得超过 10 MB。",
            selectionFailed: "无法选择此文件，请重试。",
          },
        },

        errors: {
          title: "无法完成注册。",
          incompleteRegistration: "部分注册资料尚未填写完整，请检查之前的步骤。",
          languageUnavailable: "无法确定您的首选语言。",
          registrationFailed: "无法完成注册，请重试。",
          identificationNumberExists: "此身份证号码已被注册。",
        },
      },
    },

    profile: {
      title: "个人资料",
      description: "管理您的个人及家庭资料。",

      sections: {
        personal: "个人",
        household: "家庭",
        residence: "住址",
        preferences: "偏好设置",
        account: "账户",
      },

      personalInformation: {
        title: "个人资料",
        description: "个人及人口资料",

        personalDetails: "个人资料",
        contact: "联系方式",

        fullName: "姓名",
        identificationNumber: "身份证号码",
        dateOfBirth: "出生日期",
        gender: "性别",
        citizenship: "国籍",
        mobileNumber: "手机号码",

        male: "男",
        female: "女",

        malaysian: "马来西亚公民",
        nonMalaysian: "非马来西亚公民",

        updateFailed: "无法更新您的手机号码，请重试。",
      },

      household: {
        title: "我的家庭",
        youOnly: "仅您一人",
        oneMember: "您 + 1 位家庭成员",
        multipleMembers: "您 + {{count}} 位家庭成员",

        members: "家庭成员",
        addMember: "添加家庭成员",
        editMember: "编辑家庭成员",
        completeInformation: "补充缺失资料",
        missingInformation: "缺少",
        moreFields: "另有 {{count}} 项",

        empty: {
          title: "暂无家庭成员",
          description: "添加与您居住在同一家庭的成员。",
        },

        loadError: {
          title: "无法加载家庭成员资料",
          description: "无法加载此家庭成员的资料，请重试。",
        },

        relationship: {
          spouse: "配偶",
          child: "子女",
          parent: "父母",
          sibling: "兄弟姐妹",
          grandchild: "孙子女 / 外孙子女",
          other: "其他",
        },

        member: {
          fullName: "姓名",
          relationship: "关系",
          dateOfBirth: "出生日期",
        },

        add: {
          selectRelationship: "选择关系",

          sections: {
            basicInformation: "基本资料",
            employmentIncome: "就业与教育",
            education: "教育",
            disability: "残障 / OKU",
          },

          fields: {
            citizenship: "国籍",
            identificationNumber: "身份证明号码",
            gender: "性别",
            isDependent: "此人在经济上是否依赖您？",
            employmentStatus: "就业状况",
            occupation: "职业",
            monthlyIncome: "每月收入（RM）",
            isStudent: "此人是否为学生？",
            studyMode: "学习模式",
            institutionType: "教育机构类型",
            isOku: "此人是否为残障人士（OKU）？",
            okuRegistered: "此人是否已注册为残障人士（OKU）？",
          },

          options: {
            male: "男",
            female: "女",

            malaysian: "马来西亚公民",
            nonMalaysian: "非马来西亚公民",

            employed: "受雇",
            selfEmployed: "自雇",
            unemployed: "失业",
            retired: "退休",
            homemaker: "家庭主妇／主夫",
            notWorking: "没有工作",

            fullTime: "全日制",
            partTime: "非全日制",

            school: "学校",
            college: "学院",
            university: "大学",
            other: "其他",
          },

          errorTitle: "无法添加家庭成员",
          errorDescription: "无法保存该家庭成员的资料，请重试。",
        },

        edit: {
          errorTitle: "无法更新家庭成员",
          errorDescription: "无法更新该家庭成员的资料，请重试。",
        },
      },

      incomeEmployment: {
        title: "收入与就业",
        noInformation: "就业资料",

        status: {
          employed: "受雇",
          selfEmployed: "自雇",
          unemployed: "失业",
          retired: "退休",
          notWorking: "没有工作",
        },
      },

      residentialAddress: {
        title: "居住地址",
        noAddress: "尚未提供地址",
        country: "国家",
      },

      language: {
        title: "语言",

        selectLanguageTitle: "选择语言",
        selectLanguageDescription: "选择您想使用的语言。"
      },

      account: {
        signOut: "退出登录",
        signOutDescription: "确定要退出当前账户吗？"
      },

      errors: {
        loadTitle: "无法加载个人资料",
        loadDescription: "无法加载您的个人资料。",
        tryAgain: "重试",
      },
    },

    validation: {
      required: "此项为必填项。",

      emailRequired: "请输入电子邮箱。",
      emailInvalid: "请输入有效的电子邮箱地址。",

      passwordRequired: "请输入密码。",
      passwordTooShort: "密码必须至少包含 8 个字符。",

      confirmPasswordRequired: "请确认密码。",
      passwordMismatch: "两次输入的密码不一致。",

      fullNameRequired: "请输入姓名。",

      myKadNumberRequired: "请输入身份证号码。",
      myKadNumberInvalid: "请输入有效的身份证号码。",

      dateOfBirthRequired: "请选择出生日期。",
      dateOfBirthInvalid: "请输入有效的出生日期。",
      dateOfBirthMismatch: "出生日期与身份证号码不一致。",

      citizenshipRequired: "请选择国籍。",

      mobileNumberRequired: "请输入手机号码。",
      mobileNumberInvalid: "请输入有效的马来西亚手机号码。",

      addressLine1Required: "请输入地址第一行。",

      postcodeRequired: "请输入邮政编码。",
      postcodeInvalid: "请输入有效的 5 位数邮政编码。",

      cityRequired: "请输入城市。",
      stateTerritoryRequired: "请选择州属或联邦直辖区。",

      employmentStatusRequired: "请选择就业状态。",

      incomeSourceRequired: "请选择收入来源。",
      personalMonthlyIncomeRequired: "请输入个人每月收入。",
      householdMonthlyIncomeRequired: "请输入家庭每月总收入。",
      monthlyIncomeInvalid: "请输入有效的每月收入。",

      householdMemberNameRequired: "请输入家庭成员姓名。",
      relationshipRequired: "请选择与援助领取者的关系。",

      householdMemberDobRequired: "请输入家庭成员的出生日期。",

      identificationNumberInvalid: "请输入有效的身份证明号码。",
    },
  },
};

export default zh;
