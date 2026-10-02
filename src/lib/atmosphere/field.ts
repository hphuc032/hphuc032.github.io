import { atmosphereProfiles, atmosphereViewport, type AtmosphereIntensity } from "@/data/atmosphere-config";
import { seededRandom } from "./random";

type Star = { x: number; y: number; radius: number; opacity: number };
type Meteor = { x: number; y: number; distance: number; length: number; duration: number; start: number; scale: number };
type Twinkle = { star: number; start: number; duration: number };
export type ProtectedRegion = { x: number; y: number; width: number; height: number };

/** Drawing/scheduling model owns bounded objects; DOM and lifecycle belong to the client island. */
export class AtmosphereField {
  private stars: Star[];
  private meteors: Meteor[] = [];
  private twinkles: Twinkle[] = [];
  private random: () => number;
  private intensity: AtmosphereIntensity = "light";
  private width = 1;
  private height = 1;
  private nextMeteor = 0;
  private nextTwinkle = 0;
  private burstAt = Infinity;

  constructor(seed: number) {
    const starRandom = seededRandom(seed);
    this.stars = Array.from({ length: 108 }, () => ({
      x: starRandom(), y: starRandom(), radius: .45 + starRandom() * .65, opacity: .07 + starRandom() * .15,
    }));
    this.random = seededRandom(seed ^ 0x9e3779b9);
  }

  configure(intensity: AtmosphereIntensity, width: number, height: number, now: number) {
    this.intensity = intensity; this.width = width; this.height = height;
    const profile = atmosphereProfiles[intensity];
    // Keep the session schedule across routes; only bound an inherited delay to the new rhythm.
    this.nextMeteor = this.nextMeteor ? Math.min(this.nextMeteor, now + profile.delay[1]) : now + this.meteorDelay();
    this.nextTwinkle ||= now + 4000 + this.random() * 4000;
    this.meteors.length = 0; this.twinkles.length = 0; this.burstAt = Infinity;
  }

  private meteorDelay() {
    const [minimum, maximum] = atmosphereProfiles[this.intensity].delay;
    return (minimum + this.random() * (maximum - minimum)) * (atmosphereViewport(this.width).mobile ? 1.3 : 1);
  }

  private spawnMeteor(now: number, scale = 1) {
    if (this.meteors.length >= atmosphereViewport(this.width).maxMeteors) return;
    this.meteors.push({
      x: this.width * (.08 + this.random() * .55), y: this.height * (.08 + this.random() * .35),
      distance: Math.min(this.width, this.height) * (.3 + this.random() * .25),
      length: Math.min(110, this.width * .11) * scale,
      duration: 900 + this.random() * 700, start: now, scale,
    });
  }

  tick(now: number) {
    for (let index = this.meteors.length - 1; index >= 0; index--) {
      if (now - this.meteors[index]!.start >= this.meteors[index]!.duration) this.meteors.splice(index, 1);
    }
    for (let index = this.twinkles.length - 1; index >= 0; index--) {
      if (now - this.twinkles[index]!.start >= this.twinkles[index]!.duration) this.twinkles.splice(index, 1);
    }
    if (now >= this.nextMeteor) {
      this.spawnMeteor(now);
      this.nextMeteor = now + this.meteorDelay();
      if (!atmosphereViewport(this.width).mobile && this.random() < atmosphereProfiles[this.intensity].burstChance) {
        this.burstAt = now + 600 + this.random() * 800;
      }
    }
    if (now >= this.burstAt) { this.spawnMeteor(now, .65); this.burstAt = Infinity; }
    if (now >= this.nextTwinkle) {
      const profile = atmosphereProfiles[this.intensity];
      const count = Math.max(1, Math.round(profile.twinkles * atmosphereViewport(this.width).density));
      for (let index = 0; index < count; index++) {
        this.twinkles.push({ star: Math.floor(this.random() * this.starCount), start: now + index * 650, duration: 3400 + this.random() * 1800 });
      }
      this.nextTwinkle = now + 11000 + this.random() * 8000;
    }
  }

  suspend(now: number) {
    this.meteors.length = 0; this.twinkles.length = 0; this.burstAt = Infinity;
    // No backlog on return from a hidden tab, reading surface or dialog.
    this.nextMeteor = now + this.meteorDelay();
    this.nextTwinkle = now + 5000 + this.random() * 5000;
  }

  get starCount() { return Math.round(atmosphereProfiles[this.intensity].stars * atmosphereViewport(this.width).density); }
  get active() { return this.meteors.length > 0 || this.twinkles.length > 0; }
  get meteorCount() { return this.meteors.length; }
  get nextEvent() { return Math.min(this.nextMeteor, this.nextTwinkle, this.burstAt); }

  draw(context: CanvasRenderingContext2D, now: number, animated: boolean, regions: readonly ProtectedRegion[], scrollY: number) {
    context.clearRect(0, 0, this.width, this.height);
    context.fillStyle = "#d9e2eb";
    for (let index = 0; index < this.starCount; index++) {
      const star = this.stars[index]!;
      let opacity = star.opacity;
      if (animated) for (const twinkle of this.twinkles) {
        if (twinkle.star === index && now >= twinkle.start) opacity += Math.sin((now - twinkle.start) / twinkle.duration * Math.PI) * .1;
      }
      context.globalAlpha = opacity;
      context.beginPath(); context.arc(star.x * this.width, star.y * this.height, star.radius, 0, Math.PI * 2); context.fill();
    }
    context.globalAlpha = 1;
    if (animated) for (const meteor of this.meteors) {
      const progress = Math.max(0, Math.min(1, (now - meteor.start) / meteor.duration));
      const scale = atmosphereProfiles[this.intensity].meteorScale * meteor.scale;
      const x = meteor.x + progress * meteor.distance, y = meteor.y + progress * meteor.distance * .72;
      const length = meteor.length * scale;
      const opacity = Math.sin(Math.PI * progress) * atmosphereProfiles[this.intensity].opacity;
      const trail = context.createLinearGradient(x - length, y - length * .72, x, y);
      trail.addColorStop(0, "rgba(175,198,219,0)"); trail.addColorStop(.8, `rgba(195,212,226,${opacity * .5})`); trail.addColorStop(1, `rgba(225,233,240,${opacity})`);
      context.strokeStyle = trail; context.lineWidth = .9 * scale;
      context.beginPath(); context.moveTo(x - length, y - length * .72); context.lineTo(x, y); context.stroke();
      context.globalAlpha = opacity; context.fillStyle = "#e3edf5";
      context.beginPath(); context.arc(x, y, .8 * scale, 0, Math.PI * 2); context.fill(); context.globalAlpha = 1;
    }
    // Knock out protected content. The fixed layer never paints over glyphs, input, photos or paper surfaces.
    context.globalCompositeOperation = "destination-out";
    context.fillStyle = "#000";
    for (const region of regions) {
      const y = region.y - scrollY;
      if (y < this.height && y + region.height > 0) context.fillRect(region.x, y, region.width, region.height);
    }
    context.globalCompositeOperation = "source-over";
  }
}
