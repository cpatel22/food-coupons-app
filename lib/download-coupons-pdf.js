export async function downloadCouponsPdf(element, filename = "coupons.pdf") {
  if (!element) {
    throw new Error("Coupon receipt is not ready to download");
  }

  const html2canvas = (await import("html2canvas")).default;
  const { jsPDF } = await import("jspdf");

  element.classList.add("pdf-capture");
  try {
    const canvas = await html2canvas(element, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
    });

    const image = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 36;
    const printableWidth = pageWidth - margin * 2;
    const printableHeight = pageHeight - margin * 2;
    const imageHeight = (canvas.height * printableWidth) / canvas.width;

    let remaining = imageHeight;
    let offset = margin;

    pdf.addImage(image, "PNG", margin, offset, printableWidth, imageHeight);
    remaining -= printableHeight;

    while (remaining > 0) {
      offset -= printableHeight;
      pdf.addPage();
      pdf.addImage(image, "PNG", margin, offset, printableWidth, imageHeight);
      remaining -= printableHeight;
    }

    pdf.save(filename);
  } finally {
    element.classList.remove("pdf-capture");
  }
}
