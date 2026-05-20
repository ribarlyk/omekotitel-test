interface JsonLdProps {
  data: Record<string, unknown> | Record<string, unknown>[];
}

// Server Component. Renders a JSON-LD <script> tag.
// We stringify with a replacer that strips undefined so optional schema fields
// don't leak into the output as `"foo": null`.
export function JsonLd({ data }: JsonLdProps) {
  const json = JSON.stringify(data, (_k, v) => (v === undefined ? undefined : v));
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: json }}
    />
  );
}
