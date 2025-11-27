/* eslint-disable @next/next/no-img-element */
import React from "react";
import { Download, ExternalLink, Share2 } from "lucide-react";

export const ProfileHeader = ({
    avatar,
    name,
    title,
    bio,
}: {
    avatar: string;
    name: string;
    title: string;
    bio: string;
}) => {
    return (
        <div className="flex flex-col items-center text-center p-6">
            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg mb-4">
                {avatar ? (
                    <img src={avatar} alt={name} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-400 text-4xl font-bold">
                        {name ? name.charAt(0) : "?"}
                    </div>
                )}
            </div>
            <h1 className="text-2xl font-bold text-gray-900">{name || "Your Name"}</h1>
            <p className="text-indigo-600 font-medium mt-1">{title || "Your Title"}</p>
            {bio && <p className="text-gray-600 mt-3 max-w-md text-sm leading-relaxed">{bio}</p>}
        </div>
    );
};

export const ProfileLinks = ({
    links,
}: {
    links: { label: string; url: string; icon?: string }[];
}) => {
    return (
        <div className="w-full max-w-md mx-auto p-4 space-y-3">
            {links.map((link, i) => (
                <a
                    key={i}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-4 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-indigo-100 transition-all group"
                >
                    <span className="font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">
                        {link.label}
                    </span>
                    <ExternalLink size={18} className="text-gray-400 group-hover:text-indigo-400 transition-colors" />
                </a>
            ))}
        </div>
    );
};

export const ProfileVCard = ({ vcardUrl }: { vcardUrl: string }) => {
    return (
        <div className="w-full max-w-md mx-auto p-4">
            <a
                href={vcardUrl}
                className="flex items-center justify-center gap-2 w-full py-4 bg-gray-900 text-white rounded-xl font-bold shadow-lg shadow-gray-900/20 hover:bg-gray-800 transition-all transform hover:-translate-y-0.5"
            >
                <Download size={20} />
                Save Contact
            </a>
        </div>
    );
};
