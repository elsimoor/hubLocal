import { Types } from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { GlobalVariableModel } from "@/lib/models/GlobalVariable";

export interface GlobalVariable {
  _id: string;
  key: string;
  value: string;
  label: string;
  category: string;
  description?: string;
}

export interface VariablesMap {
  [key: string]: string;
}

/**
 * Get all global variables for a user
 */
export async function getUserVariables(userId: Types.ObjectId): Promise<GlobalVariable[]> {
  await connectDB();
  const docs: any[] = await GlobalVariableModel.find({ userId }).sort({ category: 1, key: 1 }).lean();
  return docs.map((doc) => ({
    _id: doc._id.toString(),
    key: doc.key,
    value: doc.value,
    label: doc.label,
    category: doc.category,
    description: doc.description,
  }));
}

/**
 * Get variables as a map for easy replacement
 */
export async function getUserVariablesMap(userId: Types.ObjectId): Promise<VariablesMap> {
  const variables = await getUserVariables(userId);
  const map: VariablesMap = {};
  variables.forEach((v) => {
    map[v.key] = v.value;
  });
  return map;
}

/**
 * Sync profile data to global variables
 */
export async function syncProfileToVariables(userId: Types.ObjectId, profileData: any): Promise<void> {
  await connectDB();

  const operations = [
    // Profile fields
    { key: "full_name", value: profileData.displayName || "", label: "Full Name", category: "profile" },
    { key: "tagline", value: profileData.tagline || "", label: "Tagline", category: "profile" },
    { key: "slug", value: profileData.slug || "", label: "Profile Slug", category: "profile" },
    { key: "avatar_url", value: profileData.avatarUrl || "", label: "Avatar URL", category: "profile" },
    { key: "background_url", value: profileData.backgroundUrl || "", label: "Background URL", category: "profile" },
    { key: "button_primary", value: profileData.buttonPrimaryLabel || "", label: "Primary Button", category: "profile" },
    { key: "button_secondary", value: profileData.buttonSecondaryLabel || "", label: "Secondary Button", category: "profile" },
  ];

  // vCard fields - using correct ProfileVcfFields property names
  if (profileData.vcf) {
    const vcf = profileData.vcf;
    const vcfFields = [
      { key: "first_name", value: vcf.firstName || "", label: "First Name", category: "contact" },
      { key: "last_name", value: vcf.lastName || "", label: "Last Name", category: "contact" },
      { key: "cell_phone", value: vcf.cellPhone || "", label: "Cell Phone", category: "contact" },
      { key: "work_phone", value: vcf.workPhone || "", label: "Work Phone", category: "contact" },
      { key: "work_email", value: vcf.workEmail || "", label: "Work Email", category: "contact" },
      { key: "home_email", value: vcf.homeEmail || "", label: "Home Email", category: "contact" },
      { key: "email", value: vcf.workEmail || vcf.homeEmail || "", label: "Email", category: "contact" },
      { key: "phone", value: vcf.cellPhone || vcf.workPhone || "", label: "Phone", category: "contact" },
      { key: "company", value: vcf.org || "", label: "Company", category: "contact" },
      { key: "job_title", value: vcf.title || "", label: "Job Title", category: "contact" },
      { key: "website", value: vcf.url || "", label: "Website", category: "contact" },
      { key: "work_address", value: vcf.workAddress || "", label: "Work Address", category: "address" },
      { key: "work_city", value: vcf.workCity || "", label: "Work City", category: "address" },
      { key: "work_zip", value: vcf.workZip || "", label: "Work ZIP", category: "address" },
      { key: "home_address", value: vcf.homeAddress || "", label: "Home Address", category: "address" },
      { key: "home_city", value: vcf.homeCity || "", label: "Home City", category: "address" },
      { key: "home_zip", value: vcf.homeZip || "", label: "Home ZIP", category: "address" },
      { key: "bio", value: vcf.note || "", label: "Bio/Note", category: "profile" },
      { key: "linkedin", value: vcf.linkedin || "", label: "LinkedIn", category: "social" },
      { key: "github", value: vcf.github || "", label: "GitHub", category: "social" },
      { key: "whatsapp", value: vcf.whatsapp || "", label: "WhatsApp", category: "social" },
    ];
    operations.push(...vcfFields);
  }

  // Batch upsert all variables
  const bulkOps = operations.map((op) => ({
    updateOne: {
      filter: { userId, key: op.key },
      update: {
        $set: {
          value: op.value,
          label: op.label,
          category: op.category,
        },
      },
      upsert: true,
    },
  }));

  if (bulkOps.length > 0) {
    await GlobalVariableModel.bulkWrite(bulkOps);
  }
}

/**
 * Create or update a custom variable
 */
export async function upsertVariable(
  userId: Types.ObjectId,
  key: string,
  value: string,
  label: string,
  category: string = "custom",
  description?: string
): Promise<GlobalVariable> {
  await connectDB();
  const doc: any = await GlobalVariableModel.findOneAndUpdate(
    { userId, key },
    { $set: { value, label, category, description } },
    { upsert: true, new: true }
  ).lean();

  return {
    _id: doc._id.toString(),
    key: doc.key,
    value: doc.value,
    label: doc.label,
    category: doc.category,
    description: doc.description,
  };
}

/**
 * Delete a variable
 */
export async function deleteVariable(userId: Types.ObjectId, key: string): Promise<boolean> {
  await connectDB();
  const result = await GlobalVariableModel.deleteOne({ userId, key });
  return result.deletedCount > 0;
}

/**
 * Replace mustache variables in a string
 * Supports: {{variable_name}} or {{variable_name:default_value}}
 */
export function replaceVariables(text: string, variables: VariablesMap): string {
  if (!text) return text;
  
  return text.replace(/\{\{([^}]+)\}\}/g, (match, content) => {
    const parts = content.split(":");
    const key = parts[0].trim();
    const defaultValue = parts[1]?.trim() || "";
    
    return variables[key] !== undefined ? variables[key] : defaultValue;
  });
}

/**
 * Replace variables in an object recursively
 */
export function replaceVariablesInObject(obj: any, variables: VariablesMap): any {
  if (typeof obj === "string") {
    return replaceVariables(obj, variables);
  }
  
  if (Array.isArray(obj)) {
    return obj.map((item) => replaceVariablesInObject(item, variables));
  }
  
  if (obj && typeof obj === "object") {
    const result: any = {};
    for (const key in obj) {
      result[key] = replaceVariablesInObject(obj[key], variables);
    }
    return result;
  }
  
  return obj;
}
