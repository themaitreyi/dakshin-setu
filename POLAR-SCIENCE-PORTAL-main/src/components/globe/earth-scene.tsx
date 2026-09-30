import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

export interface EarthPin {
  id: string;
  name: string;
  lat: number;
  lon: number;
}
export function EarthScene({
  lat,
  lon,
  zoom,
  clouds,
  pins,
  selected,
  select,
}: {
  lat: number;
  lon: number;
  zoom: number;
  clouds: boolean;
  pins: EarthPin[];
  selected?: string;
  select: (id: string) => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const latest = useRef({ lat, lon, zoom, clouds, pins, selected, select });
  latest.current = { lat, lon, zoom, clouds, pins, selected, select };
  const [error, setError] = useState("");
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    } catch {
      setError("3D graphics are unavailable on this device. Choose Satellite map below.");
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    Object.assign(renderer.domElement.style, {
      position: "absolute",
      inset: "0",
      width: "100%",
      height: "100%",
      display: "block",
    });
    element.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
    const earthGroup = new THREE.Group();
    scene.add(earthGroup);
    const geometry = new THREE.SphereGeometry(1, 128, 96);
    const loader = new THREE.TextureLoader();
    const texture = loader.load("/textures/earth-hd.jpg", undefined, undefined, () =>
      setError("Surface imagery could not load. Please reload or use the map."),
    );
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const material = new THREE.MeshPhongMaterial({
      map: texture,
      shininess: 12,
      specular: new THREE.Color(0x23495b),
    });
    const earth = new THREE.Mesh(geometry, material);
    earthGroup.add(earth);
    const cloudTexture = loader.load("/textures/clouds.png");
    const cloudMaterial = new THREE.MeshPhongMaterial({
      map: cloudTexture,
      alphaMap: cloudTexture,
      transparent: true,
      opacity: 0.62,
      depthWrite: false,
    });
    const cloudShell = new THREE.Mesh(new THREE.SphereGeometry(1.012, 64, 48), cloudMaterial);
    earthGroup.add(cloudShell);
    const glowMaterial = new THREE.ShaderMaterial({
      vertexShader:
        "varying vec3 n; varying vec3 v; void main(){vec4 p=modelViewMatrix*vec4(position,1.0);n=normalize(normalMatrix*normal);v=normalize(-p.xyz);gl_Position=projectionMatrix*p;}",
      fragmentShader:
        "varying vec3 n; varying vec3 v; void main(){float rim=pow(1.0-abs(dot(normalize(n),normalize(v))),3.0);gl_FragColor=vec4(0.25,0.7,1.0,rim*0.32);}",
      transparent: true,
      depthWrite: false,
    });
    const glow = new THREE.Mesh(new THREE.SphereGeometry(1.035, 64, 48), glowMaterial);
    earthGroup.add(glow);
    scene.add(new THREE.AmbientLight(0xffffff, 1.3));
    const sun = new THREE.DirectionalLight(0xfff6e4, 2.2);
    scene.add(sun);
    const markerGeometry = new THREE.SphereGeometry(0.012, 12, 8);
    const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xffbc68 });
    const markers = new THREE.Group();
    earthGroup.add(markers);
    let pinKey = "";
    const location = (latitude: number, longitude: number, radius: number) => {
      const p = (latitude * Math.PI) / 180,
        l = (longitude * Math.PI) / 180;
      return new THREE.Vector3(
        radius * Math.cos(p) * Math.cos(l),
        radius * Math.sin(p),
        -radius * Math.cos(p) * Math.sin(l),
      );
    };
    const raycaster = new THREE.Raycaster();
    const click = (event: MouseEvent) => {
      const rect = element.getBoundingClientRect();
      raycaster.setFromCamera(
        new THREE.Vector2(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          (-(event.clientY - rect.top) / rect.height) * 2 + 1,
        ),
        camera,
      );
      const hits = raycaster.intersectObjects([earth, ...markers.children]);
      if (hits[0]?.object.userData["id"])
        latest.current.select(hits[0].object.userData["id"] as string);
    };
    renderer.domElement.addEventListener("click", click);
    const resize = new ResizeObserver(() => {
      const width = element.clientWidth;
      renderer.setSize(width, width, false);
      camera.aspect = 1;
      camera.updateProjectionMatrix();
    });
    resize.observe(element);
    let active = true;
    const observer = new IntersectionObserver(([entry]) => {
      active = !!entry?.isIntersecting;
    });
    observer.observe(element);
    let frame = 0,
      last = 0;
    const render = (now: number) => {
      frame = requestAnimationFrame(render);
      if (!active || now - last < 32) return;
      last = now;
      const props = latest.current;
      camera.position.copy(location(props.lat, props.lon, 3.6 / props.zoom));
      camera.lookAt(0, 0, 0);
      sun.position.copy(camera.position).add(new THREE.Vector3(-2, 3, 2));
      cloudShell.visible = props.clouds;
      const key = props.pins.map((p) => p.id).join(",");
      if (key !== pinKey) {
        markers.clear();
        props.pins.forEach((pin) => {
          const marker = new THREE.Mesh(markerGeometry, markerMaterial);
          marker.position.copy(location(pin.lat, pin.lon, 1.027));
          marker.userData["id"] = pin.id;
          markers.add(marker);
        });
        pinKey = key;
      }
      markers.children.forEach((marker) => {
        const activeMarker = marker.userData["id"] === props.selected;
        const pulse = activeMarker ? 1.7 + Math.sin(now / 180) * 0.18 : 1;
        marker.scale.setScalar(pulse);
      });
      renderer.render(scene, camera);
    };
    frame = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(frame);
      resize.disconnect();
      observer.disconnect();
      renderer.domElement.removeEventListener("click", click);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) object.geometry.dispose();
      });
      material.dispose();
      cloudMaterial.dispose();
      glowMaterial.dispose();
      markerMaterial.dispose();
      texture.dispose();
      cloudTexture.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);
  return (
    <div ref={host} className="relative aspect-square w-full">
      {error && (
        <p
          role="status"
          className="absolute inset-x-4 top-4 rounded-xl bg-white/95 p-3 text-sm text-slate-700"
        >
          {error}
        </p>
      )}
    </div>
  );
}
