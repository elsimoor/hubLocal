import React from "react";
import PublishedClient from "./PublishedClient";

// With Next.js 15, params is a Promise in RSC. Unwrap with React.use.
export default function PublishedPage({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = React.use(params);
  return <PublishedClient slugParts={slug || []} />;
}
