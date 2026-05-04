import { ProfileForm } from "@/components/forms/profile-form";
import { PageHeader } from "@/components/layout/page-header";
import { saveProfileAction } from "@/lib/actions/profile";
import { requireUser } from "@/lib/auth/session";

const joinList = (value?: string[] | null) => (value ?? []).join(", ");

export default async function OnboardingPage() {
  const user = await requireUser();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Onboarding"
        title="Build your candidate profile"
        description="Add the details the matching engine needs: roles you want, where you want them, how senior they should be, and which skills or companies matter."
      />
      <ProfileForm
        action={saveProfileAction}
        defaults={{
          fullName: user.fullName,
          phone: user.phone,
          headline: user.headline,
          yearsExperience: user.yearsExperience,
          desiredJobTitles: joinList(user.preferences?.desiredJobTitles),
          preferredIndustries: joinList(user.preferences?.preferredIndustries),
          preferredLocations: joinList(user.preferences?.preferredLocations),
          workModes: user.preferences?.workModes ?? [],
          minimumSalary: user.preferences?.minimumSalary,
          seniorityLevels: user.preferences?.seniorityLevels ?? [],
          topSkills: joinList(user.preferences?.topSkills),
          certifications: joinList(user.preferences?.certifications),
          degree: user.preferences?.degree,
          includeKeywords: joinList(user.preferences?.includeKeywords),
          excludeKeywords: joinList(user.preferences?.excludeKeywords),
          targetCompanies: joinList(user.preferences?.targetCompanies),
          avoidCompanies: joinList(user.preferences?.avoidCompanies),
          autoHideEnabled: user.preferences?.autoHideEnabled
        }}
        redirectTo="/dashboard"
        submitLabel="Save onboarding and continue"
      />
    </div>
  );
}
