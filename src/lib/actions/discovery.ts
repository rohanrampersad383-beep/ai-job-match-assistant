"use server";

import type { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/session";
import { errorState, successState, type ActionState } from "@/lib/actions/shared";
import { runAllEnabledSources, runDiscoveryForSource } from "@/lib/discovery/run";
import { prisma } from "@/lib/db/prisma";
import { parseDelimitedList, slugify } from "@/lib/utils";
import { discoverySourceSchema } from "@/lib/validations/discovery";

export async function saveDiscoverySourceAction(
  _: ActionState,
  formData: FormData
): Promise<ActionState> {
  await requireUser();

  const parsed = discoverySourceSchema.safeParse({
    id: formData.get("id") || undefined,
    name: formData.get("name"),
    sourceType: formData.get("sourceType"),
    baseUrl: formData.get("baseUrl"),
    publicUrl: formData.get("publicUrl"),
    fetchStrategy: formData.get("fetchStrategy"),
    parserKey: formData.get("parserKey"),
    legalNotes: formData.get("legalNotes"),
    defaultTags: formData.get("defaultTags"),
    regionTags: formData.get("regionTags"),
    pollingIntervalMinutes: formData.get("pollingIntervalMinutes"),
    dedupeStrategy: formData.get("dedupeStrategy"),
    enabled: formData.get("enabled") === "on",
    configJson: formData.get("configJson")
  });

  if (!parsed.success) {
    return errorState(parsed.error.issues[0]?.message ?? "Unable to save source.");
  }

  let config: Prisma.InputJsonValue = {};

  try {
    config = JSON.parse(parsed.data.configJson || "{}") as Prisma.InputJsonValue;
  } catch {
    return errorState("Source config JSON is invalid.");
  }

  const payload = {
    name: parsed.data.name,
    sourceType: parsed.data.sourceType,
    baseUrl: parsed.data.baseUrl,
    publicUrl: parsed.data.publicUrl || null,
    fetchStrategy: parsed.data.fetchStrategy,
    parserKey: parsed.data.parserKey,
    legalNotes: parsed.data.legalNotes,
    defaultTags: parseDelimitedList(parsed.data.defaultTags),
    regionTags: parseDelimitedList(parsed.data.regionTags),
    pollingIntervalMinutes: parsed.data.pollingIntervalMinutes,
    dedupeStrategy: parsed.data.dedupeStrategy,
    enabled: parsed.data.enabled,
    config
  };

  if (parsed.data.id) {
    await prisma.discoverySource.update({
      where: { id: parsed.data.id },
      data: payload
    });
  } else {
    await prisma.discoverySource.create({
      data: {
        ...payload,
        slug: slugify(parsed.data.name)
      }
    });
  }

  revalidatePath("/sources");
  return successState("Source saved.");
}

export async function toggleDiscoverySourceAction(formData: FormData) {
  await requireUser();
  const sourceId = String(formData.get("sourceId") ?? "");

  if (!sourceId) {
    return;
  }

  const source = await prisma.discoverySource.findUnique({
    where: { id: sourceId }
  });

  if (!source) {
    return;
  }

  await prisma.discoverySource.update({
    where: { id: sourceId },
    data: {
      enabled: !source.enabled,
      healthStatus: !source.enabled ? "UNKNOWN" : "DISABLED"
    }
  });

  revalidatePath("/sources");
}

export async function runDiscoverySourceAction(formData: FormData) {
  const user = await requireUser();
  const sourceId = String(formData.get("sourceId") ?? "");

  if (!sourceId) {
    return;
  }

  await runDiscoveryForSource(sourceId, user.id);
  revalidatePath("/sources");
  revalidatePath("/discovery-runs");
  revalidatePath("/review-queue");
  revalidatePath("/dashboard");
}

export async function runAllDiscoverySourcesAction() {
  const user = await requireUser();

  await runAllEnabledSources(user.id);
  revalidatePath("/sources");
  revalidatePath("/discovery-runs");
  revalidatePath("/review-queue");
  revalidatePath("/dashboard");
}

export async function runDiscoverySourceFeedbackAction(
  state: ActionState,
  formData: FormData
): Promise<ActionState> {
  void state;
  const user = await requireUser();
  const sourceId = String(formData.get("sourceId") ?? "");

  if (!sourceId) {
    return errorState("Select a source before running discovery.");
  }

  try {
    const summary = await runDiscoveryForSource(sourceId, user.id);
    revalidatePath("/sources");
    revalidatePath("/discovery-runs");
    revalidatePath("/review-queue");
    revalidatePath("/dashboard");

    return successState(
      `Discovery finished. Imported ${summary.jobsImported}, grouped ${summary.duplicatesSkipped} duplicates, and logged ${summary.parsingFailures + summary.runtimeErrors} issues.`
    );
  } catch (error) {
    return errorState(error instanceof Error ? error.message : "Discovery run failed.");
  }
}

export async function runAllDiscoverySourcesFeedbackAction(
  state: ActionState,
  formData: FormData
): Promise<ActionState> {
  void state;
  void formData;
  const user = await requireUser();

  try {
    const results = await runAllEnabledSources(user.id);
    const successful = results.filter(
      (result): result is { sourceId: string; status: "success"; summary: Awaited<ReturnType<typeof runDiscoveryForSource>> } =>
        result.status === "success"
    );
    const failed = results.filter((result) => result.status === "failed");
    const imported = successful.reduce((sum, result) => sum + result.summary.jobsImported, 0);
    const duplicates = successful.reduce((sum, result) => sum + result.summary.duplicatesSkipped, 0);

    revalidatePath("/sources");
    revalidatePath("/discovery-runs");
    revalidatePath("/review-queue");
    revalidatePath("/dashboard");

    if (!successful.length) {
      return errorState("No enabled sources completed successfully.");
    }

    return successState(
      `Ran ${successful.length} source${successful.length === 1 ? "" : "s"}, imported ${imported} jobs, grouped ${duplicates} duplicates${failed.length ? `, and ${failed.length} source${failed.length === 1 ? "" : "s"} failed` : ""}.`
    );
  } catch (error) {
    return errorState(error instanceof Error ? error.message : "Discovery run failed.");
  }
}
