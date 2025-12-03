import { AppModel } from "@/lib/models/App";
import { PuckDocModel } from "@/lib/models/PuckDoc";
import { UserModel } from "@/lib/models/User";
import { connectDB } from "@/lib/mongodb";
import { cloneProfileTemplateData } from "@/lib/puck/profileTemplate";
import { getLegacyProfileDocSlugs, getProfileDocSlug } from "@/lib/profile/docSlug";

export async function ensureDefaultApp(email: string) {
    await connectDB();

    // 1. Ensure User has a username
    const user = await UserModel.findOne({ email });
    if (!user) return; // Should not happen during auth callback

    if (!user.username) {
        let base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9]/g, "");
        let candidate = base;
        let counter = 1;
        while (await UserModel.exists({ username: candidate })) {
            candidate = `${base}${counter++}`;
        }
        user.username = candidate;
        await user.save();
    }

    // 2. Ensure Default App exists
    let defaultApp = await AppModel.findOne({ ownerEmail: email, isDefault: true });

    if (!defaultApp) {
        // Check if ANY app exists to avoid duplicates if we just missed the flag
        const anyApp = await AppModel.findOne({ ownerEmail: email });
        if (anyApp) {
            // If apps exist but none marked default, maybe mark the first one? 
            // Or just create a new one. Let's create a specific "Default App"
            // to be safe and consistent with the plan.
        }

        defaultApp = await AppModel.create({
            ownerEmail: email,
            name: "Default App",
            slug: "default-app",
            description: "Your default application container",
            isDefault: true,
            visibility: "public",
        });
    }

    // 3. Ensure Profile PuckDoc exists for this app's "home" page
    const desiredSlug = getProfileDocSlug(defaultApp.slug);
    const fallbackSlugs = getLegacyProfileDocSlugs(defaultApp.slug);

    let profileDoc = await PuckDocModel.findOne({ ownerEmail: email, slug: desiredSlug });

    if (!profileDoc) {
        const legacyDoc = await PuckDocModel.findOne({ ownerEmail: email, slug: { $in: fallbackSlugs } });
        if (legacyDoc) {
            legacyDoc.slug = desiredSlug;
            profileDoc = await legacyDoc.save();
        }
    }

    if (!profileDoc) {
        profileDoc = await PuckDocModel.create({
            ownerEmail: email,
            slug: desiredSlug,
            status: "published",
            data: cloneProfileTemplateData(),
            publishedAt: new Date(),
        });
    } else if (!profileDoc.data || !(profileDoc.data as any)?.root) {
        profileDoc.data = cloneProfileTemplateData();
        profileDoc.status = "published";
        profileDoc.publishedAt = profileDoc.publishedAt ?? new Date();
        await profileDoc.save();
    }

    return { defaultApp, profileDoc, user };
}
