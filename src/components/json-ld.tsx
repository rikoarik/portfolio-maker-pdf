import { getSiteUrl } from "@/lib/site";

export function JsonLd() {
  const site = getSiteUrl().origin;
  const data = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${site}/#org`,
        name: "Portfolio Maker",
        url: site,
      },
      {
        "@type": "WebSite",
        "@id": `${site}/#website`,
        url: site,
        name: "Portfolio Maker",
        description:
          "Ubah screenshot aplikasi menjadi portofolio PDF profesional dengan AI. Bahasa Indonesia.",
        inLanguage: "id-ID",
        publisher: { "@id": `${site}/#org` },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
