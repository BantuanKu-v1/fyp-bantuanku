import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ProfileStackParamList } from "../../../types/tabNavigator";
import { getHouseholdMembers, HouseholdMemberSummary } from "../../../services/profile/householdService";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { AlertTriangle, ChevronRight, UserRound } from "lucide-react-native";
import { useTranslation } from "react-i18next";
import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";

import Screen from "../../../components/layout/Screen";
import ScreenHeader from "../../../components/layout/ScreenHeader";
import Button from "../../../components/ui/Button";
import Card from "../../../components/ui/Card";
import Section from "../../../components/layout/Section";
import ErrorState from "../../../components/feedback/ErrorState";
import EmptyState from "../../../components/feedback/EmptyState";

type HouseholdScreenProps = NativeStackScreenProps<ProfileStackParamList, "Household">;

type HouseholdMemberRowProps = {
  member: HouseholdMemberSummary;
  relationship: string;
  onPress: () => void;
  showDivider?: boolean;
};

const maskIdentificationNumber = (
    identificationNumber: string | null
): string | null => {
  if (!identificationNumber?.trim()) {
    return null;
  }

  const normalized = identificationNumber.replace(/\D/g, "");

  if (normalized.length === 12) {
    return `••••••-••-${normalized.slice(-4)}`;
  }

  return "••••••••";
};

function HouseholdMemberRow({
    member,
    relationship,
    onPress,
    showDivider = true
}: HouseholdMemberRowProps) {
  const { t } = useTranslation();

  const initials = member.fullName
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((name) => name.charAt(0))
      .slice(0, 2)
      .join("")
      .toUpperCase();

  const maskedIdentificationNumber = maskIdentificationNumber(
      member.identificationNumber
  );

  const hasMissingInformation = member.missingFields.length > 0;

  const missingFieldKeys: Record<string, string> = {
    fullName: "profile.household.member.fullName",
    relationship: "profile.household.member.relationship",
    identificationNumber: "profile.household.add.fields.identificationNumber",
    dateOfBirth: "profile.household.member.dateOfBirth",
    gender: "profile.household.add.fields.gender",
    citizenship: "profile.household.add.fields.citizenship",
    isOku: "profile.household.add.fields.isOku",
    studyMode: "profile.household.add.fields.studyMode",
    institutionType: "profile.household.add.fields.institutionType",
    okuRegistered: "profile.household.add.fields.okuRegistered"
  };

  const visibleMissingFields = member.missingFields
      .slice(0, 2)
      .map((field) => {
        const translationKey = missingFieldKeys[field];

        return translationKey
            ? t(translationKey)
            : field;
      });

  const remainingMissingFields = Math.max(
      member.missingFields.length - 2,
      0
  );

  const missingInformationText = visibleMissingFields.join(", ");

  return (
      <View>
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            className="flex-row items-center py-4"
        >
          {/* Avatar */}
          <View className="h-11 w-11 items-center justify-center rounded-full bg-primary/20">
            <Text className="text-base font-semibold text-primary">
              {initials || "?"}
            </Text>
          </View>

          {/* Member Info */}
          <View className="ml-3 flex-1">
            <Text className="text-base font-medium text-foreground">
              {member.fullName}
            </Text>

            <Text className="mt-0.5 text-sm text-muted-foreground">
              {relationship}
            </Text>

            {maskedIdentificationNumber && (
                <Text className="mt-0.5 text-sm text-muted-foreground">
                  {maskedIdentificationNumber}
                </Text>
            )}

            {hasMissingInformation && (
                <View className="mt-2 flex-row items-start gap-1.5">
                  <AlertTriangle
                      size={14}
                      color="#D97706"
                      style={{ marginTop: 1 }}
                  />

                  <Text className="flex-1 text-xs font-medium text-amber-600">
                    {t("profile.household.missingInformation")}:{" "}
                    {missingInformationText}

                    {remainingMissingFields > 0 && (
                        <Text>
                          {" "}
                          {t("profile.household.moreFields", {
                            count: remainingMissingFields
                          })}
                        </Text>
                    )}
                  </Text>
                </View>
            )}
          </View>

          <ChevronRight size={20} color="#9CA3AF" />
        </Pressable>

        {showDivider && (
            <View className="h-px bg-border" />
        )}
      </View>
  );
}

export default function HouseholdScreen({
    navigation
}: HouseholdScreenProps) {
  const { t } = useTranslation();

  const [householdMembers, setHouseholdMembers] = useState<HouseholdMemberSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadHouseholdMembers =
      useCallback(async () => {
        try {
          setLoading(true);
          setError(false);

          const data = await getHouseholdMembers();

          setHouseholdMembers(data);
        } catch (loadError) {
          if (__DEV__) {
            console.error(
                "[PROFILE] Failed to load household members:", loadError
            );
          }

          setError(true);
        } finally {
          setLoading(false);
        }
      }, []);

  useFocusEffect(
      useCallback(() => {
        void loadHouseholdMembers();
      }, [loadHouseholdMembers])
  );

  const getRelationshipLabel = (
      relationship: string
  ) => {
    const relationshipKeys: Record<string, string> = {
      spouse: "spouse",
      child: "child",
      parent: "parent",
      sibling: "sibling",
      grandchild: "grandchild",
      other: "other"
    };

    const relationshipKey = relationshipKeys[relationship];

    if (!relationshipKey) {
      return relationship;
    }

    return t(`profile.household.relationship.${relationshipKey}`);
  };

  const memberCount = householdMembers.length;

  if (loading) {
    return (
        <Screen scroll={false}>
          <ScreenHeader
              title={t("profile.household.title")}
              onBack={() => navigation.goBack()}
          />

          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#0352CE" />
          </View>
        </Screen>
    );
  }

  if (error) {
    return (
        <Screen scroll={false}>
          <ScreenHeader
              title={t("profile.household.title")}
              onBack={() => navigation.goBack()}
          />

          <View className="flex-1 justify-center">
            <ErrorState
                title={t("profile.errors.loadTitle")}
                description={t("profile.errors.loadDescription")}
                onRetry={() => void loadHouseholdMembers()}
            />
          </View>
        </Screen>
    );
  }

  return (
      <Screen>
        <ScreenHeader
            title={t("profile.household.title")}
            onBack={() => navigation.goBack()}
            className="mb-8"
        />

        {/* Household Overview */}
        <View className="rounded-2xl border border-primary/20 bg-primary/5 p-5">
          <View className="flex-row items-center">

            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
              <UserRound size={26} color="#0352CE" />
            </View>

            <View className="ml-4 flex-1">
              <Text className="text-sm font-medium text-muted-foreground">
                {t("profile.household.members")}
              </Text>

              <Text className="mt-1 text-2xl font-bold text-foreground">
                {memberCount}
              </Text>
            </View>
          </View>
        </View>

        {/* Add Household Member */}
        <Button
            className="mt-6"
            onPress={() => navigation.navigate("AddHouseholdMember")}
        >
          {t("profile.household.addMember")}
        </Button>

        {/* Household Members */}
        {memberCount === 0 ? (
            <Card className="mt-8">
              <EmptyState
                  icon={UserRound}
                  title={t("profile.household.empty.title")}
                  description={t("profile.household.empty.description")}
              />
            </Card>
        ) : (
            <Section
                title={t("profile.household.members")}
                className="mt-8"
            >
              <Card>
                {householdMembers.map((member, index) => (
                    <HouseholdMemberRow
                        key={member.id}
                        member={member}
                        relationship={getRelationshipLabel(member.relationship)}
                        onPress={() =>
                            navigation.navigate(
                                "HouseholdMember",
                                {
                                  memberId: member.id,
                                }
                            )
                        }
                        showDivider={index < householdMembers.length - 1}
                    />
                ))}
              </Card>
            </Section>
        )}
      </Screen>
  );
}
