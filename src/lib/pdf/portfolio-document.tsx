import type { ReactElement } from "react";
import {
  Document,
  Image as PdfImage,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { getCaseStudiesForPdf, type DraftPayload, type ScreenDraft } from "@/lib/draft";
import { buildPortfolioCoverModel } from "@/lib/pdf/portfolio-cover";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    lineHeight: 1.4,
  },
  title: { fontSize: 22, marginBottom: 12, fontFamily: "Helvetica-Bold" },
  heading: { fontSize: 14, marginTop: 12, marginBottom: 6, fontFamily: "Helvetica-Bold" },
  summary: { marginBottom: 8 },
  tech: { marginBottom: 4 },
  shotTitle: { fontSize: 12, marginBottom: 6, fontFamily: "Helvetica-Bold" },
  bullet: { marginLeft: 8, marginBottom: 2 },
  image: { width: "100%", objectFit: "contain", marginBottom: 8, maxHeight: 360 },
  notes: { marginTop: 4, color: "#333333" },
  coverThumbGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 4,
  },
  coverThumbCell: { width: "48%", marginBottom: 10 },
  coverThumbImage: {
    width: "100%",
    maxHeight: 150,
    objectFit: "contain",
  },
  coverMoreNote: { fontSize: 9, color: "#555555", marginTop: 2 },
});

export type ShotImage = {
  assetId: string;
  dataUri: string;
};

export type PortfolioPdfProps = {
  title: string;
  draft: DraftPayload;
  images: ShotImage[];
};

export type MultiProjectPdfProps = {
  projects: PortfolioPdfProps[];
};

function screenForAsset(draft: DraftPayload, assetId: string): ScreenDraft | undefined {
  return draft.screens.find((s) => s.assetId === assetId);
}

const compactStyles = StyleSheet.create({
  page: {
    padding: 24,
    fontFamily: "Helvetica",
    fontSize: 9,
    lineHeight: 1.35,
  },
  title: { fontSize: 16, marginBottom: 8, fontFamily: "Helvetica-Bold" },
  heading: { fontSize: 11, marginTop: 8, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  summary: { marginBottom: 6 },
  tech: { marginBottom: 4 },
  shotTitle: { fontSize: 10, marginBottom: 4, fontFamily: "Helvetica-Bold" },
  bullet: { marginLeft: 6, marginBottom: 1 },
  image: { width: "100%", objectFit: "contain", marginBottom: 6, maxHeight: 280 },
  notes: { marginTop: 2, color: "#333333" },
  coverThumbGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 2,
  },
  coverThumbCell: { width: "48%", marginBottom: 6 },
  coverThumbImage: {
    width: "100%",
    maxHeight: 100,
    objectFit: "contain",
  },
  coverMoreNote: { fontSize: 8, color: "#555555", marginTop: 2 },
});

export function PortfolioPdfDocumentCompact({ title, draft, images }: PortfolioPdfProps) {
  const studies = getCaseStudiesForPdf(draft);
  const skipStudyIntro = studies.length === 1 && studies[0].id === "default";
  const byAsset = new Map(images.map((i) => [i.assetId, i]));
  const cover = buildPortfolioCoverModel({
    title,
    draft,
    images: images.map((image) => ({ assetId: image.assetId, src: image.dataUri })),
  });

  return (
    <Document>
      <Page size="A4" style={compactStyles.page}>
        <Text style={compactStyles.title}>{cover.title}</Text>
        {cover.roleFocus ? (
          <Text style={compactStyles.summary}>Fokus: {cover.roleFocus}</Text>
        ) : null}
        {cover.highlights.length > 0 ? (
          <>
            <Text style={compactStyles.heading}>Sorotan</Text>
            {cover.highlights.map((highlight, i) => (
              <Text key={i} style={compactStyles.bullet}>
                • {highlight}
              </Text>
            ))}
          </>
        ) : null}
        {cover.showNarrativeBlocks ? (
          <>
            <Text style={compactStyles.heading}>Problem</Text>
            <Text style={compactStyles.summary}>{cover.problemSummary}</Text>
            <Text style={compactStyles.heading}>Solution</Text>
            <Text style={compactStyles.summary}>{cover.solutionSummary}</Text>
            <Text style={compactStyles.heading}>Impact</Text>
            <Text style={compactStyles.summary}>{cover.impactSummary}</Text>
          </>
        ) : null}
        {cover.sections.length > 0 ? (
          <>
            {cover.sections.map((section) => (
              <View key={section.id} wrap={false}>
                <Text style={compactStyles.heading}>{section.label}</Text>
                <Text style={compactStyles.summary}>{section.content}</Text>
              </View>
            ))}
          </>
        ) : null}
        <Text style={compactStyles.heading}>Ringkasan</Text>
        <Text style={compactStyles.summary}>{cover.projectSummary}</Text>
        <Text style={compactStyles.heading}>Tech stack</Text>
        <Text style={compactStyles.tech}>{cover.techStackText}</Text>
        {cover.showStudies ? (
          <>
            <Text style={compactStyles.heading}>Bab / studi kasus</Text>
            {cover.studies.map((study, i) => (
              <Text key={study.id} style={compactStyles.bullet}>
                {i + 1}. {study.title}
              </Text>
            ))}
          </>
        ) : null}
        {cover.images.length > 0 ? (
          <>
            <Text style={compactStyles.heading}>Pratinjau screenshot</Text>
            <View style={compactStyles.coverThumbGrid}>
              {cover.images.map((image) => (
                <View
                  key={`cover-${image.assetId}`}
                  style={compactStyles.coverThumbCell}
                >
                  <PdfImage
                    style={compactStyles.coverThumbImage}
                    src={image.src}
                  />
                </View>
              ))}
            </View>
            {cover.moreImagesCount > 0 ? (
              <Text style={compactStyles.coverMoreNote}>
                +{cover.moreImagesCount} screenshot lainnya di halaman berikutnya.
              </Text>
            ) : null}
          </>
        ) : null}
      </Page>
      {studies.flatMap((study) => {
        const nodes: ReactElement[] = [];
        if (!skipStudyIntro || study.id !== "default") {
          nodes.push(
            <Page key={`study-${study.id}`} size="A4" style={compactStyles.page}>
              <Text style={compactStyles.shotTitle}>
                {study.title || "Studi kasus"}
              </Text>
              <Text style={compactStyles.summary}>{study.summary || "—"}</Text>
              {study.tags.length > 0 ? (
                <Text style={compactStyles.tech}>{study.tags.join(", ")}</Text>
              ) : null}
            </Page>,
          );
        }
        for (const aid of study.screenAssetIds) {
          const img = byAsset.get(aid);
          if (!img) continue;
          const screen = screenForAsset(draft, img.assetId);
          nodes.push(
            <Page key={`${study.id}-${img.assetId}`} size="A4" style={compactStyles.page}>
              <Text style={compactStyles.shotTitle}>
                {screen?.title || study.title || "Layar"}
              </Text>
              <PdfImage style={compactStyles.image} src={img.dataUri} />
              {(screen?.bullets ?? []).map((b, i) => (
                <Text key={i} style={compactStyles.bullet}>
                  • {b}
                </Text>
              ))}
              {screen?.notes ? (
                <Text style={compactStyles.notes}>{screen.notes}</Text>
              ) : null}
            </Page>,
          );
        }
        return nodes;
      })}
    </Document>
  );
}

export function PortfolioPdfDocument({ title, draft, images }: PortfolioPdfProps) {
  const studies = getCaseStudiesForPdf(draft);
  const skipStudyIntro = studies.length === 1 && studies[0].id === "default";
  const byAsset = new Map(images.map((i) => [i.assetId, i]));
  const cover = buildPortfolioCoverModel({
    title,
    draft,
    images: images.map((image) => ({ assetId: image.assetId, src: image.dataUri })),
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>{cover.title}</Text>
        {cover.roleFocus ? (
          <Text style={styles.summary}>Fokus: {cover.roleFocus}</Text>
        ) : null}
        {cover.highlights.length > 0 ? (
          <>
            <Text style={styles.heading}>Sorotan</Text>
            {cover.highlights.map((highlight, i) => (
              <Text key={i} style={styles.bullet}>
                • {highlight}
              </Text>
            ))}
          </>
        ) : null}
        {cover.showNarrativeBlocks ? (
          <>
            <Text style={styles.heading}>Problem</Text>
            <Text style={styles.summary}>{cover.problemSummary}</Text>
            <Text style={styles.heading}>Solution</Text>
            <Text style={styles.summary}>{cover.solutionSummary}</Text>
            <Text style={styles.heading}>Impact</Text>
            <Text style={styles.summary}>{cover.impactSummary}</Text>
          </>
        ) : null}
        {cover.sections.length > 0 ? (
          <>
            {cover.sections.map((section) => (
              <View key={section.id} wrap={false}>
                <Text style={styles.heading}>{section.label}</Text>
                <Text style={styles.summary}>{section.content}</Text>
              </View>
            ))}
          </>
        ) : null}
        <Text style={styles.heading}>Ringkasan</Text>
        <Text style={styles.summary}>{cover.projectSummary}</Text>
        <Text style={styles.heading}>Tech stack</Text>
        <Text style={styles.tech}>{cover.techStackText}</Text>
        {cover.showStudies ? (
          <>
            <Text style={styles.heading}>Bab / studi kasus</Text>
            {cover.studies.map((study, i) => (
              <Text key={study.id} style={styles.bullet}>
                {i + 1}. {study.title}
              </Text>
            ))}
          </>
        ) : null}
        {cover.images.length > 0 ? (
          <>
            <Text style={styles.heading}>Pratinjau screenshot</Text>
            <View style={styles.coverThumbGrid}>
              {cover.images.map((image) => (
                <View key={`cover-${image.assetId}`} style={styles.coverThumbCell}>
                  <PdfImage style={styles.coverThumbImage} src={image.src} />
                </View>
              ))}
            </View>
            {cover.moreImagesCount > 0 ? (
              <Text style={styles.coverMoreNote}>
                +{cover.moreImagesCount} screenshot lainnya di halaman berikutnya.
              </Text>
            ) : null}
          </>
        ) : null}
      </Page>

      {studies.flatMap((study) => {
        const nodes: ReactElement[] = [];
        if (!skipStudyIntro || study.id !== "default") {
          nodes.push(
            <Page key={`study-${study.id}`} size="A4" style={styles.page}>
              <Text style={styles.shotTitle}>
                {study.title || "Studi kasus"}
              </Text>
              <Text style={styles.summary}>{study.summary || "—"}</Text>
              {study.tags.length > 0 ? (
                <Text style={styles.tech}>{study.tags.join(", ")}</Text>
              ) : null}
            </Page>,
          );
        }
        for (const aid of study.screenAssetIds) {
          const img = byAsset.get(aid);
          if (!img) continue;
          const screen = screenForAsset(draft, img.assetId);
          nodes.push(
            <Page key={`${study.id}-${img.assetId}`} size="A4" style={styles.page}>
              <Text style={styles.shotTitle}>
                {screen?.title || study.title || "Layar"}
              </Text>
              <PdfImage style={styles.image} src={img.dataUri} />
              {(screen?.bullets ?? []).map((b, i) => (
                <Text key={i} style={styles.bullet}>
                  • {b}
                </Text>
              ))}
              {screen?.notes ? (
                <Text style={styles.notes}>{screen.notes}</Text>
              ) : null}
            </Page>,
          );
        }
        return nodes;
      })}
    </Document>
  );
}

// ---------------------------------------------------------------------------
// Multi-project: gabungkan banyak project sekaligus dalam satu PDF
// ---------------------------------------------------------------------------

const dividerStyles = StyleSheet.create({
  divPage: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 11,
    backgroundColor: "#18181b",
    justifyContent: "center",
  },
  divIndex: { fontSize: 11, color: "#a1a1aa", marginBottom: 8 },
  divTitle: { fontSize: 28, fontFamily: "Helvetica-Bold", color: "#ffffff", marginBottom: 12 },
  divSummary: { fontSize: 11, color: "#d4d4d8", lineHeight: 1.5 },
  divTech: { marginTop: 14, fontSize: 9, color: "#71717a" },
  divTechLabel: { fontFamily: "Helvetica-Bold", color: "#a1a1aa", marginBottom: 3 },
});

const compactDividerStyles = StyleSheet.create({
  divPage: {
    padding: 24,
    fontFamily: "Helvetica",
    fontSize: 9,
    backgroundColor: "#18181b",
    justifyContent: "center",
  },
  divIndex: { fontSize: 9, color: "#a1a1aa", marginBottom: 6 },
  divTitle: { fontSize: 20, fontFamily: "Helvetica-Bold", color: "#ffffff", marginBottom: 8 },
  divSummary: { fontSize: 9, color: "#d4d4d8", lineHeight: 1.4 },
  divTech: { marginTop: 10, fontSize: 8, color: "#71717a" },
  divTechLabel: { fontFamily: "Helvetica-Bold", color: "#a1a1aa", marginBottom: 2 },
});

export function MultiProjectPdfDocument({ projects }: MultiProjectPdfProps) {
  return (
    <Document>
      {/* Cover gabungan */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.title}>Portfolio</Text>
        <Text style={styles.heading}>Daftar Proyek</Text>
        {projects.map((p, i) => (
          <Text key={i} style={{ marginBottom: 4 }}>
            {i + 1}{"."} {"  "}{p.title || "Tanpa judul"}
          </Text>
        ))}
      </Page>

      {/* Tiap project: divider page lalu screenshot pages */}
      {projects.flatMap((p, idx) => {
        const divPage = (
          <Page key={`div-${idx}`} size="A4" style={dividerStyles.divPage}>
            <Text style={dividerStyles.divIndex}>Proyek {idx + 1} / {projects.length}</Text>
            <Text style={dividerStyles.divTitle}>{p.title || "Tanpa judul"}</Text>
            {p.draft.projectSummary ? (
              <Text style={dividerStyles.divSummary}>{p.draft.projectSummary}</Text>
            ) : null}
            {p.draft.techStack.length > 0 ? (
              <View style={dividerStyles.divTech}>
                <Text style={dividerStyles.divTechLabel}>Tech Stack</Text>
                <Text>{p.draft.techStack.join("  ·  ")}</Text>
              </View>
            ) : null}
          </Page>
        );

        const shotPages = p.images.map((img) => {
          const screen = screenForAsset(p.draft, img.assetId);
          return (
            <Page key={`${idx}-${img.assetId}`} size="A4" style={styles.page}>
              <Text style={styles.shotTitle}>{screen?.title || "Layar"}</Text>
              <PdfImage style={styles.image} src={img.dataUri} />
              {(screen?.bullets ?? []).map((b, i) => (
                <Text key={i} style={styles.bullet}>{"• "}{b}</Text>
              ))}
              {screen?.notes ? <Text style={styles.notes}>{screen.notes}</Text> : null}
            </Page>
          );
        });

        return [divPage, ...shotPages];
      })}
    </Document>
  );
}

export function MultiProjectPdfDocumentCompact({ projects }: MultiProjectPdfProps) {
  return (
    <Document>
      {/* Cover gabungan */}
      <Page size="A4" style={compactStyles.page}>
        <Text style={compactStyles.title}>Portfolio</Text>
        <Text style={compactStyles.heading}>Daftar Proyek</Text>
        {projects.map((p, i) => (
          <Text key={i} style={{ marginBottom: 3 }}>
            {i + 1}{"."} {"  "}{p.title || "Tanpa judul"}
          </Text>
        ))}
      </Page>

      {projects.flatMap((p, idx) => {
        const divPage = (
          <Page key={`div-${idx}`} size="A4" style={compactDividerStyles.divPage}>
            <Text style={compactDividerStyles.divIndex}>Proyek {idx + 1} / {projects.length}</Text>
            <Text style={compactDividerStyles.divTitle}>{p.title || "Tanpa judul"}</Text>
            {p.draft.projectSummary ? (
              <Text style={compactDividerStyles.divSummary}>{p.draft.projectSummary}</Text>
            ) : null}
            {p.draft.techStack.length > 0 ? (
              <View style={compactDividerStyles.divTech}>
                <Text style={compactDividerStyles.divTechLabel}>Tech Stack</Text>
                <Text>{p.draft.techStack.join("  ·  ")}</Text>
              </View>
            ) : null}
          </Page>
        );

        const shotPages = p.images.map((img) => {
          const screen = screenForAsset(p.draft, img.assetId);
          return (
            <Page key={`${idx}-${img.assetId}`} size="A4" style={compactStyles.page}>
              <Text style={compactStyles.shotTitle}>{screen?.title || "Layar"}</Text>
              <PdfImage style={compactStyles.image} src={img.dataUri} />
              {(screen?.bullets ?? []).map((b, i) => (
                <Text key={i} style={compactStyles.bullet}>{"• "}{b}</Text>
              ))}
              {screen?.notes ? <Text style={compactStyles.notes}>{screen.notes}</Text> : null}
            </Page>
          );
        });

        return [divPage, ...shotPages];
      })}
    </Document>
  );
}
