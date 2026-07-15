// Build-time stub for jsPDF's optional dependencies (html2canvas, canvg,
// dompurify). They power jsPDF features this app never calls (`.html()`,
// `.addSvgAsImage()`), but as installed optionalDependencies they would be
// bundled and PWA-precached onto every ward device (~380 KB). See the
// aliases in vite.config.ts.
export default {};
