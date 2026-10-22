import { prisma } from "../prisma/client.js";

export class SummaryEngineService {
  /**
   * Resolves template placeholders with unified patient clinical data
   */
  static renderTemplate(templateSections: any[], unifiedData: any): string {
    const getValue = (path: string): string => {
      const parts = path.split(".");
      let curr = unifiedData;
      for (const p of parts) {
        if (!curr) return "";
        curr = curr[p]?.value !== undefined ? curr[p].value : curr[p];
      }
      if (Array.isArray(curr)) {
        return `<ul style="margin:4px 0; padding-left:20px;">${curr.map(item => `<li>${item}</li>`).join("")}</ul>`;
      }
      return curr !== undefined && curr !== null ? String(curr) : "Not Specified";
    };

    let fullHtml = "";

    for (const section of templateSections) {
      let content = section.content || "";
      // Replace all {{placeholder}} with real resolved values
      content = content.replace(/\{\{([a-zA-Z0-9_\.]+)\}\}/g, (_: string, match: string) => {
        return getValue(match);
      });

      fullHtml += `
        <div class="summary-section" style="margin-bottom: 18px; border-bottom: 1px solid #E5E5E5; padding-bottom: 12px;">
          <h4 style="margin: 0 0 8px 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #111111;">
            ${section.title}
          </h4>
          <div style="font-size: 13px; line-height: 1.6; color: #222222;">
            ${content}
          </div>
        </div>
      `;
    }

    return fullHtml;
  }

  /**
   * Generates or regenerates a discharge summary revision
   */
  static async generateSummary(taskId: string, templateId: string, userId: string) {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        generatedSummaries: {
          orderBy: { revisionNumber: "desc" }
        }
      }
    });

    if (!task) throw new Error("Task not found");
    if (!task.unifiedClinicalData) throw new Error("Unified clinical data is required to generate summary");

    const template = await prisma.summaryTemplate.findUnique({
      where: { id: templateId }
    });

    if (!template) throw new Error("Summary template not found");

    const renderedHtml = this.renderTemplate(template.sections as any[], task.unifiedClinicalData);

    const latestRevision = task.generatedSummaries[0]?.revisionNumber || 0;
    const newRevisionNumber = latestRevision + 1;

    const generatedSummary = await prisma.generatedSummary.create({
      data: {
        taskId: task.id,
        summaryTemplateId: template.id,
        templateVersion: template.version,
        revisionNumber: newRevisionNumber,
        contentHtml: renderedHtml,
        contentJson: task.unifiedClinicalData,
        status: "GENERATED",
        isImmutable: false
      }
    });

    // Update Task Status
    await prisma.task.update({
      where: { id: task.id },
      data: { status: "READY_FOR_REVIEW" }
    });

    return generatedSummary;
  }
}

