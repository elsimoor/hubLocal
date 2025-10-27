import React from "react";
import PublishedClient from "../[...slug]/PublishedClient";

export default function PublishedPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = React.use(params);
  return <PublishedClient slugParts={[slug]} />;
}
