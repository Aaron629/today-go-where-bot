import liff from '@line/liff'
export async function initLiff() {
  const id = import.meta.env.VITE_LIFF_ID
  if (!id) throw new Error('VITE_LIFF_ID 未設定')
  await liff.init({ liffId: id })
  return liff
}
