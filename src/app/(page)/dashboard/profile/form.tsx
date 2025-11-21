"use client"; // Si tu es sur /app

import { useState } from "react";

export default function VcfForm() {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    cellPhone: "",
    workPhone: "",
    workEmail: "",
    homeEmail: "",
    workAddress: "",
    workCity: "",
    workZip: "",
    homeAddress: "",
    homeCity: "",
    homeZip: "",
    org: "",
    title: "",
    url: "",
    note: "",
    linkedin: "",
    github: "",
    whatsapp: "",
  });

  const [image, setImage] = useState<string | null>(null);

  const onChange = (e: any) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleImage = (e: any) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = (e: any) => {
    e.preventDefault();

    const photoBase64 = image ? image.split(",")[1] : "";

    const vcf = `
BEGIN:VCARD
VERSION:3.0
N:${form.lastName};${form.firstName};;;
FN:${form.firstName} ${form.lastName}
${photoBase64 ? `PHOTO;ENCODING=b;TYPE=JPEG:${photoBase64}` : ""}
TEL;TYPE=CELL:${form.cellPhone}
TEL;TYPE=WORK:${form.workPhone}
EMAIL;TYPE=WORK:${form.workEmail}
EMAIL;TYPE=HOME:${form.homeEmail}
ADR;TYPE=WORK:;;${form.workAddress};${form.workCity};;${form.workZip};Morocco
ADR;TYPE=HOME:;;${form.homeAddress};${form.homeCity};;${form.homeZip};Morocco
ORG:${form.org}
TITLE:${form.title}
URL:${form.url}
NOTE:${form.note}
X-SOCIALPROFILE;TYPE=linkedIn:${form.linkedin}
X-SOCIALPROFILE;TYPE=github:${form.github}
X-SOCIALPROFILE;TYPE=whatsapp:${form.whatsapp}
END:VCARD
    `.trim();

    console.log(vcf);
    alert("VCF printed in console!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <form
        onSubmit={onSubmit}
        className="w-full max-w-2xl bg-white shadow-md rounded-2xl border border-gray-200 p-6 space-y-4"
      >

        {/* Image upload */}
        <div>
          <label className="block font-semibold mb-1">Photo</label>
          <input type="file" accept="image/*" onChange={handleImage} />
        </div>

        {/* Name */}
        <div className="grid grid-cols-2 gap-3">
          <input
            name="firstName"
            placeholder="First Name"
            onChange={onChange}
            className="border p-2 rounded"
          />
          <input
            name="lastName"
            placeholder="Last Name"
            onChange={onChange}
            className="border p-2 rounded"
          />
        </div>

        {/* Phones */}
        <div className="grid grid-cols-2 gap-3">
          <input
            name="cellPhone"
            placeholder="Cell Phone"
            onChange={onChange}
            className="border p-2 rounded"
          />
          <input
            name="workPhone"
            placeholder="Work Phone"
            onChange={onChange}
            className="border p-2 rounded"
          />
        </div>

        {/* Emails */}
        <div className="grid grid-cols-2 gap-3">
          <input
            name="workEmail"
            placeholder="Work Email"
            onChange={onChange}
            className="border p-2 rounded"
          />
          <input
            name="homeEmail"
            placeholder="Home Email"
            onChange={onChange}
            className="border p-2 rounded"
          />
        </div>

        {/* Work address */}
        <h2 className="font-semibold text-gray-700">Work Address</h2>
        <input
          name="workAddress"
          placeholder="Address"
          onChange={onChange}
          className="border p-2 rounded w-full"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            name="workCity"
            placeholder="City"
            onChange={onChange}
            className="border p-2 rounded"
          />
          <input
            name="workZip"
            placeholder="ZIP"
            onChange={onChange}
            className="border p-2 rounded"
          />
        </div>

        {/* Home address */}
        <h2 className="font-semibold text-gray-700">Home Address</h2>
        <input
          name="homeAddress"
          placeholder="Address"
          onChange={onChange}
          className="border p-2 rounded w-full"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            name="homeCity"
            placeholder="City"
            onChange={onChange}
            className="border p-2 rounded"
          />
          <input
            name="homeZip"
            placeholder="ZIP"
            onChange={onChange}
            className="border p-2 rounded"
          />
        </div>

        {/* Other fields */}
        <input
          name="org"
          placeholder="Organization"
          onChange={onChange}
          className="border p-2 rounded w-full"
        />
        <input
          name="title"
          placeholder="Job Title"
          onChange={onChange}
          className="border p-2 rounded w-full"
        />
        <input
          name="url"
          placeholder="Website URL"
          onChange={onChange}
          className="border p-2 rounded w-full"
        />
        <textarea
          name="note"
          placeholder="Note"
          onChange={onChange}
          className="border p-2 rounded w-full"
        />

        {/* Social links */}
        <input
          name="linkedin"
          placeholder="LinkedIn URL"
          onChange={onChange}
          className="border p-2 rounded w-full"
        />
        <input
          name="github"
          placeholder="GitHub URL"
          onChange={onChange}
          className="border p-2 rounded w-full"
        />
        <input
          name="whatsapp"
          placeholder="WhatsApp Number"
          onChange={onChange}
          className="border p-2 rounded w-full"
        />

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700"
        >
          Generate VCF
        </button>
      </form>
    </div>
  );
}
