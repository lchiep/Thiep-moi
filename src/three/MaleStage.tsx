import { useLayoutEffect, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { ContactShadows, Environment, Lightformer } from '@react-three/drei'
import { Folder3D, FOLDER, type FolderHandle } from '../components/DocumentFolder/Folder3D'
import type { FolderAssets } from '../components/DocumentFolder/folderAssets'

/**
 * Sân khấu 3D nhánh Nam: nền ảnh (màn cuộc gọi) nằm PHÍA SAU canvas trong suốt,
 * canvas chỉ vẽ tập tài liệu + bóng đổ của nó lên giường.
 *
 * Ánh sáng khớp ảnh nền: nắng ấm từ cửa sổ góc trên-trái (key), trời lạnh nhẹ (fill),
 * môi trường tối (phòng ngủ) → nhựa đen chỉ bắt vài vệt sáng.
 */

/** GSAP điều khiển camera qua object này (không setState mỗi frame). */
export type CameraRigState = {
  fit: number // bề ngang (đơn vị thế giới) cần vừa màn hình
  lookZ: number // dịch điểm nhìn (âm = tập nằm thấp hơn trên màn hình)
  drift: number // biên độ trôi camera khi đứng yên
  lookX: number // lia camera ngang
  lookY: number // độ cao điểm nhìn (mặt thiệp nằm cao hơn giường một chút)
  tilt: number // góc nghiêng camera (rad), ~0 = nhìn thẳng từ trên xuống
}

export const TILT = THREE.MathUtils.degToRad(24) // góc camera mặc định lệch khỏi phương thẳng đứng
const FOV = 30

function CameraRig({ rig }: { rig: CameraRigState }) {
  const { camera, size } = useThree()
  useFrame(({ clock }) => {
    const cam = camera as THREE.PerspectiveCamera
    const aspect = size.width / size.height
    const halfTan = Math.tan(THREE.MathUtils.degToRad(FOV / 2))
    const dist = rig.fit / (2 * halfTan * aspect)
    const t = clock.elapsedTime
    const dx = Math.sin(t * 0.21) * rig.drift
    const dz = Math.cos(t * 0.17) * rig.drift
    const tilt = Math.max(0.002, rig.tilt) // tránh nhìn thẳng đứng tuyệt đối (lookAt suy biến)
    cam.position.set(rig.lookX + dx, rig.lookY + dist * Math.cos(tilt), rig.lookZ + dist * Math.sin(tilt) + dz)
    cam.lookAt(rig.lookX + dx * 0.4, rig.lookY, rig.lookZ)
  })
  return null
}

type Props = {
  assets: FolderAssets
  rig: CameraRigState
  folderRef: React.RefObject<FolderHandle | null>
  /** chạy ngay khi mô hình vừa gắn, TRƯỚC khung hình đầu (đặt tư thế ban đầu) */
  onMount: (f: FolderHandle) => void
  onReady: () => void
}

export default function MaleStage({ assets, rig, folderRef, onMount, onReady }: Props) {
  const key = useRef<THREE.DirectionalLight>(null!)
  const fired = useRef(false)

  useLayoutEffect(() => {
    key.current.target.position.set(0, 0, 0)
    key.current.target.updateMatrixWorld()
    if (folderRef.current) onMount(folderRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // báo sẵn sàng sau khung hình đầu tiên (texture đã upload lên GPU)
  useFrame(() => {
    if (fired.current) return
    fired.current = true
    requestAnimationFrame(onReady)
  })

  return (
    <>
      <CameraRig rig={rig} />

      {/* nắng cửa sổ: ấm, xiên từ trên-trái, bóng đổ mềm */}
      <directionalLight
        ref={key}
        position={[-3.4, 5.2, -2.8]}
        intensity={1.45}
        color="#ffdcb0"
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0002}
        shadow-normalBias={0.015}
        shadow-radius={6}
        shadow-camera-left={-2}
        shadow-camera-right={2}
        shadow-camera-top={2}
        shadow-camera-bottom={-2}
        shadow-camera-near={1}
        shadow-camera-far={14}
      />
      {/* ánh trời lạnh hắt ngược lại (fill) */}
      <directionalLight position={[3, 2.2, 3.5]} intensity={0.35} color="#a9b8cc" />
      <hemisphereLight args={['#c9ccd4', '#1b140e', 0.2]} />

      {/* môi trường để nhựa có phản chiếu thật (dựng tại chỗ, không tải HDR) */}
      <Environment resolution={128} frames={1}>
        <color attach="background" args={['#0c0a09']} />
        <Lightformer form="rect" intensity={3.2} color="#ffe2b8" position={[-4, 5, -3]} scale={[4, 2.5, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={0.6} color="#dfe6f0" position={[0, 6, 0]} scale={[6, 6, 1]} rotation-x={Math.PI / 2} />
        <Lightformer form="rect" intensity={0.35} color="#ffffff" position={[4, 2, 4]} scale={[3, 2, 1]} target={[0, 0, 0]} />
      </Environment>

      {/* chỉ nhận bóng: bóng tập tài liệu in lên vải giường của ảnh nền */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 14]} />
        <shadowMaterial transparent opacity={0.7} color="#0b0705" />
      </mesh>
      {/* bóng tiếp xúc sát mép tập (chỗ nhựa đè lên vải) */}
      <ContactShadows position={[0, 0.0015, 0]} scale={4} resolution={256} blur={2.2} far={0.35} opacity={0.75} color="#050302" />

      <Folder3D ref={folderRef} assets={assets} />
    </>
  )
}

export const FOLDER_FIT = {
  closed: FOLDER.W * 1.55,
  open: FOLDER.W * 2.28,
  // dịch điểm nhìn để tập nằm trên phần giường trống phía dưới MacBook
  lookClosed: -0.55,
  lookOpen: -1.0,
} as const
