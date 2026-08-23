// Origami Models Data and Diagram Helpers

export function drawPaperBox(c, x, y, w, h) {
    if (w === undefined) {
        c.fillStyle = '#f1f5f9';
        c.fillRect(0, 0, x, y);
        return;
    }
    c.fillStyle = '#f8fafc';
    c.strokeStyle = '#94a3b8';
    c.lineWidth = 1;
    c.fillRect(x, y, w, h);
    c.strokeRect(x, y, w, h);
}

export function line(c, x1, y1, x2, y2, col, lw, dash) {
    c.save();
    c.strokeStyle = col;
    c.lineWidth = lw;
    if (dash) c.setLineDash([5, 4]);
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.stroke();
    c.restore();
}

export function tri(c, x1, y1, x2, y2, x3, y3, col) {
    c.fillStyle = col + '44';
    c.strokeStyle = col;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.lineTo(x3, y3);
    c.closePath();
    c.fill();
    c.stroke();
}

export function diamond(c, w, h, col) {
    c.fillStyle = col + '44';
    c.strokeStyle = col;
    c.lineWidth = 2;
    c.beginPath();
    c.moveTo(w / 2, h * 0.08);
    c.lineTo(w * 0.9, h / 2);
    c.lineTo(w / 2, h * 0.92);
    c.lineTo(w * 0.1, h / 2);
    c.closePath();
    c.fill();
    c.stroke();
}

export function heart(c, w, h, col) {
    c.fillStyle = col;
    c.beginPath();
    c.moveTo(w / 2, h * 0.7);
    c.bezierCurveTo(w * 0.1, h * 0.5, w * 0.1, h * 0.2, w / 2, h * 0.35);
    c.bezierCurveTo(w * 0.9, h * 0.2, w * 0.9, h * 0.5, w / 2, h * 0.7);
    c.closePath();
    c.fill();
}

export function drawCraneOutline(c, w, h) {
    c.fillStyle = 'rgba(99,102,241,0.2)';
    c.strokeStyle = '#6366f1';
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(0, -h * 0.35);
    c.lineTo(-w * 0.3, 0);
    c.lineTo(0, h * 0.35);
    c.lineTo(w * 0.3, 0);
    c.closePath();
    c.fill();
    c.stroke();
}

export function drawBoatOutline(c, w, h) {
    c.fillStyle = 'rgba(56,189,248,0.25)';
    c.strokeStyle = '#0284c7';
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(-w * 0.4, h * 0.1);
    c.lineTo(-w * 0.35, h * 0.25);
    c.lineTo(w * 0.35, h * 0.25);
    c.lineTo(w * 0.4, h * 0.1);
    c.closePath();
    c.fill();
    c.stroke();
    tri(c, -w * 0.1, -h * 0.3, w * 0.1, -h * 0.3, 0, h * 0.1, '#0284c7');
}

export function drawPlaneOutline(c, w, h) {
    c.fillStyle = 'rgba(245,158,11,0.25)';
    c.strokeStyle = '#f59e0b';
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(-w * 0.45, h * 0.05);
    c.lineTo(w * 0.45, 0);
    c.lineTo(-w * 0.45, -h * 0.05);
    c.closePath();
    c.fill();
    c.stroke();
}

export function drawFoxOutline(c, w, h) {
    c.fillStyle = 'rgba(249,115,22,0.3)';
    c.strokeStyle = '#f97316';
    c.lineWidth = 2.5;
    c.beginPath();
    c.moveTo(0, -h * 0.1);
    c.lineTo(-w * 0.3, -h * 0.3);
    c.lineTo(-w * 0.15, h * 0.2);
    c.lineTo(w * 0.15, h * 0.2);
    c.lineTo(w * 0.3, -h * 0.3);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = '#000';
    c.beginPath();
    c.arc(0, h * 0.12, 4, 0, Math.PI * 2);
    c.fill();
}

export const ORIGAMI = [
    {
        name: 'Paper Crane 🦢',
        level: 'hard',
        steps: [
            { text: 'Start with a square sheet. Fold diagonally in half corner-to-corner both ways, then unfold.', draw: (c,w,h) => { line(c,0,0,w,h,'#6366f1',2); line(c,w,0,0,h,'#6366f1',2); drawPaperBox(c,w,h); } },
            { text: 'Fold in half horizontally and vertically. Unfold to see 4 intersecting crease lines.', draw: (c,w,h) => { line(c,w/2,0,w/2,h,'#f59e0b',2); line(c,0,h/2,w,h/2,'#f59e0b',2); drawPaperBox(c,w,h); } },
            { text: 'Bring all four corners together to collapse into a smaller square base.', draw: (c,w,h) => { drawPaperBox(c,w*.25,h*.25,w*.5,h*.5); line(c,w*.25,h*.25,w*.75,h*.75,'#6366f1',1.5,true); } },
            { text: 'Fold the left and right flaps toward the center vertical crease.', draw: (c,w,h) => { drawPaperBox(c,w*.2,h*.1,w*.6,h*.8); line(c,w*.2,h*.1,w/2,h*.9,'#f59e0b',1.5); line(c,w*.8,h*.1,w/2,h*.9,'#f59e0b',1.5); } },
            { text: 'Open the flaps and petal-fold into a long diamond shape. Repeat on the back.', draw: (c,w,h) => { diamond(c,w,h,'#6366f1'); } },
            { text: 'Inside-reverse fold the neck and head. Gently pull out the wings. Your Crane is complete! 🦢', draw: (c,w,h) => { c.save(); c.translate(w/2,h/2); drawCraneOutline(c,w,h); c.restore(); } }
        ]
    },
    {
        name: 'Paper Boat ⛵',
        level: 'easy',
        steps: [
            { text: 'Fold the rectangular paper in half from top to bottom.', draw: (c,w,h) => { drawPaperBox(c,0,h*.25,w,h*.5); line(c,0,h/2,w,h/2,'#6366f1',2); } },
            { text: 'Fold both top corners inward to meet at the center vertical crease.', draw: (c,w,h) => { drawPaperBox(c,0,h*.25,w,h*.75); tri(c,0,h*.25,w,h*.25,w/2,h*.5,'#6366f1'); } },
            { text: 'Fold the bottom front strip upward. Flip over and fold the back strip upward.', draw: (c,w,h) => { drawPaperBox(c,0,h*.2,w,h*.75); drawPaperBox(c,w*.1,h*.65,w*.8,h*.15,'#f59e0b'); } },
            { text: 'Open the hat shape from the bottom and flatten into a diamond.', draw: (c,w,h) => { diamond(c,w,h,'#38bdf8'); } },
            { text: 'Fold bottom triangles up on both sides, then pull open the sides to reveal your Boat! ⛵', draw: (c,w,h) => { c.save(); c.translate(w/2,h/2); drawBoatOutline(c,w,h); c.restore(); } }
        ]
    },
    {
        name: 'Paper Plane ✈️',
        level: 'easy',
        steps: [
            { text: 'Fold the paper in half lengthwise to create a center crease, then unfold.', draw: (c,w,h) => { drawPaperBox(c,0,0,w,h); line(c,w/2,0,w/2,h,'#6366f1',2); } },
            { text: 'Fold the top two corners into the center line.', draw: (c,w,h) => { drawPaperBox(c,0,0,w,h); tri(c,0,0,w/2,0,w/2,h*.35,'#f59e0b'); tri(c,w,0,w/2,0,w/2,h*.35,'#f59e0b'); } },
            { text: 'Fold the new angled edges into the center again to form a sharp dart nose.', draw: (c,w,h) => { drawPaperBox(c,0,0,w,h); line(c,0,h*.25,w/2,h*.1,'#6366f1',2); line(c,w,h*.25,w/2,h*.1,'#6366f1',2); } },
            { text: 'Fold the plane in half along the center, then fold both wings down. Ready for takeoff! ✈️', draw: (c,w,h) => { c.save(); c.translate(w/2,h/2); drawPlaneOutline(c,w,h); c.restore(); } }
        ]
    },
    {
        name: 'Paper Heart ❤️',
        level: 'easy',
        steps: [
            { text: 'Fold a square sheet in half diagonally to form a large triangle.', draw: (c,w,h) => { tri(c,0,h,w,h,w/2,0,'#f59e0b'); } },
            { text: 'Fold the top point down to meet the midpoint of the base.', draw: (c,w,h) => { tri(c,0,h,w,h,w/2,0,'#f59e0b'); line(c,w/2,0,w/2,h,'#6366f1',1.5,true); } },
            { text: 'Fold both bottom sharp corners up toward the top center.', draw: (c,w,h) => { drawPaperBox(c,w*.1,h*.35,w*.8,h*.55); line(c,0,h*.6,w*.3,h*.35,'#6366f1',2); line(c,w,h*.6,w*.7,h*.35,'#6366f1',2); } },
            { text: 'Turn over and fold the top corner tips inward to smooth the Heart shape! ❤️', draw: (c,w,h) => { heart(c,w,h,'#ef4444'); } }
        ]
    },
    {
        name: 'Origami Fox 🦊',
        level: 'easy',
        steps: [
            { text: 'Fold square paper in half diagonally into a triangle.', draw: (c,w,h) => { tri(c,w*.1,h*.85,w*.9,h*.85,w/2,h*.15,'#f97316'); } },
            { text: 'Fold the two corners down to meet the bottom tip, forming a diamond.', draw: (c,w,h) => { diamond(c,w,h,'#f97316'); line(c,w/2,h*.1,w/2,h*.9,'#6366f1',1.5,true); } },
            { text: 'Fold in half vertically, then fold back the outer flaps to form the ears and face! 🦊', draw: (c,w,h) => { c.save(); c.translate(w/2,h/2); drawFoxOutline(c,w,h); c.restore(); } }
        ]
    }
];
