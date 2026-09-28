/**
 * GM ARCH TOOLS — Architectural Export Engine (Iteration 03)
 * Author: Guru Murthy (GM)
 * Features:
 *   - High-Res Image Export (1080p, 2K, 4K, Current Viewport, Custom)
 *   - Transparent PNG Background (Alpha channel for Photoshop, Illustrator, InDesign, Canva)
 *   - Solid Background or Current Viewport Background
 *   - Strict JPG Transparency Rule: Warning alert, no silent conversion
 *   - Clean Presentation Mode (strips all UI chrome, controls, and buttons)
 *   - Interactive Pre-Export Preview Modal with dimensions and format
 *   - Instant Browser File Download
 */

export class ExportEngine {
  constructor() {
    this.resolutions = {
      CURRENT: { label: 'Current Viewport', width: 0, height: 0 },
      '1080P': { label: '1920 × 1080 (Full HD)', width: 1920, height: 1080 },
      '2K': { label: '2560 × 1440 (2K QHD)', width: 2560, height: 1440 },
      '4K': { label: '3840 × 2160 (4K UHD)', width: 3840, height: 2160 }
    };
  }

  validateSettings(format, background) {
    if (format === 'JPG' && background === 'TRANSPARENT') {
      return {
        valid: false,
        error: 'JPG does not support transparent backgrounds.\n\nPlease choose:\n• PNG + Transparent\n• JPG + Solid Background'
      };
    }
    return { valid: true };
  }

  validateExportOptions({ format = 'PNG', background = 'TRANSPARENT', resolution = 'CURRENT' } = {}) {
    const fmt = format.toUpperCase();
    const bg = background.toUpperCase();
    const check = this.validateSettings(fmt, bg);
    if (!check.valid) {
      return {
        valid: false,
        warning: check.error,
        error: check.error
      };
    }
    return { valid: true };
  }

  getDimensionsForResolution(preset, customW = 1920, customH = 1080) {
    const key = (preset || '1080P').toUpperCase();
    return this.getResolutionDimensions(key, customW, customH);
  }

  getResolutionDimensions(preset, customW = 1920, customH = 1080) {
    const normalized = (preset || '1080P').toUpperCase();
    if (normalized === 'CUSTOM') {
      return {
        width: Math.max(200, Math.min(7680, parseInt(customW, 10) || 1920)),
        height: Math.max(200, Math.min(4320, parseInt(customH, 10) || 1080))
      };
    }

    if (normalized === 'CURRENT') {
      const canvas = typeof document !== 'undefined' ? document.getElementById('sa-three-canvas') : null;
      if (canvas) {
        return { width: canvas.width, height: canvas.height };
      }
      if (typeof window !== 'undefined') {
        return { width: window.innerWidth, height: window.innerHeight };
      }
      return { width: 1920, height: 1080 };
    }

    const cfg = this.resolutions[normalized] || this.resolutions['1080P'];
    return { width: cfg.width, height: cfg.height };
  }

  async generateExportData({
    format = 'PNG',
    background = 'TRANSPARENT', // 'TRANSPARENT' | 'SOLID' | 'VIEWPORT'
    resolution = 'CURRENT',
    customW = 1920,
    customH = 1080,
    cleanPresentation = true
  } = {}) {
    const val = this.validateSettings(format, background);
    if (!val.valid) {
      throw new Error(val.error);
    }

    const dims = this.getResolutionDimensions(resolution, customW, customH);
    const canvas = document.createElement('canvas');
    canvas.width = dims.width;
    canvas.height = dims.height;
    const ctx = canvas.getContext('2d');

    // 1. Render Background
    if (background === 'TRANSPARENT' && format === 'PNG') {
      ctx.clearRect(0, 0, dims.width, dims.height);
    } else if (background === 'SOLID') {
      ctx.fillStyle = '#06090f';
      ctx.fillRect(0, 0, dims.width, dims.height);
    } else {
      // Viewport background gradient
      const grad = ctx.createRadialGradient(
        dims.width / 2, dims.height / 2, 50,
        dims.width / 2, dims.height / 2, dims.width / 1.2
      );
      grad.addColorStop(0, '#0e1726');
      grad.addColorStop(1, '#06090f');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, dims.width, dims.height);
    }

    // 2. Draw 3D Viewport if available
    const threeCanvas = document.getElementById('sa-three-canvas');
    if (threeCanvas && threeCanvas.width > 0 && threeCanvas.height > 0) {
      ctx.drawImage(threeCanvas, 0, 0, dims.width, dims.height);
    } else {
      // Draw Architectural Blueprint Fallback
      this.drawBlueprintPlaceholder(ctx, dims.width, dims.height);
    }

    // 3. If Clean Presentation is FALSE, draw drafting title block overlay
    if (!cleanPresentation) {
      this.drawArchitecturalTitleBlock(ctx, dims.width, dims.height, format);
    }

    // 4. Output mime
    const mime = format === 'JPG' ? 'image/jpeg' : 'image/png';
    const quality = format === 'JPG' ? 0.95 : 1.0;
    const dataUrl = canvas.toDataURL(mime, quality);

    return {
      dataUrl,
      width: dims.width,
      height: dims.height,
      format,
      background,
      mime
    };
  }

  drawBlueprintPlaceholder(ctx, w, h) {
    // Grid
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 1;
    const step = 40;
    for (let x = 0; x < w; x += step) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += step) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Center Isometric Massing Wireframe Box
    const cx = w / 2;
    const cy = h / 2;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;

    ctx.strokeRect(cx - 160, cy - 100, 320, 200);

    ctx.font = 'bold 24px "JetBrains Mono", monospace';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('GM ARCH TOOLS', cx, cy - 20);

    ctx.font = '14px "Space Grotesk", sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('ARCHITECTURAL PRESENTATION EXPORT', cx, cy + 15);
  }

  drawArchitecturalTitleBlock(ctx, w, h, format) {
    // Bottom title bar
    const barHeight = 44;
    ctx.fillStyle = 'rgba(6, 9, 15, 0.88)';
    ctx.fillRect(0, h - barHeight, w, barHeight);

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h - barHeight);
    ctx.lineTo(w, h - barHeight);
    ctx.stroke();

    ctx.font = 'bold 12px "JetBrains Mono", monospace';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'left';
    ctx.fillText('GM ARCH TOOLS · UNIFIED DESIGN WORKSPACE', 20, h - 18);

    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'right';
    const dateStr = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    ctx.fillText(`Scale: N.T.S. · Date: ${dateStr} · Format: ${format}`, w - 20, h - 18);
  }

  downloadImage(dataUrl, filename) {
    const link = document.createElement('a');
    link.download = filename || `GM_ARCH_TOOLS_${Date.now()}`;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export const exportEngine = new ExportEngine();
