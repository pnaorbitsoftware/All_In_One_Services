import { Helmet } from "@dr.pogodin/react-helmet";
import { getCanonicalUrl, targetKeywords } from "./seoData";

export default function SEO({
  title = "ServiceHub India | Best Home Services and Local Service Booking Platform",
  description = "ServiceHub India is a local service marketplace to book verified electricians, plumbers, AC repair, cleaners, painters, carpenters, and appliance repair providers.",
  keywords = targetKeywords,
  path = "/",
  image = "/servicehub-icon.png",
  type = "website",
  schema = [],
  noIndex = false,
}) {
  const canonical = getCanonicalUrl(path);
  const schemas = Array.isArray(schema) ? schema : [schema];
  const googleVerification = import.meta.env.VITE_GOOGLE_SITE_VERIFICATION;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords.join(", ")} />
      {googleVerification && <meta name="google-site-verification" content={googleVerification} />}
      <link rel="canonical" href={canonical} />
      {noIndex && <meta name="robots" content="noindex,nofollow" />}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={image.startsWith("http") ? image : getCanonicalUrl(image)} />
      <meta property="og:site_name" content="ServiceHub India" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image.startsWith("http") ? image : getCanonicalUrl(image)} />
      {schemas.filter(Boolean).map((item, index) => (
        <script key={`schema-${index}`} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
}
