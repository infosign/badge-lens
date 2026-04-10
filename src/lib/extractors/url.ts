import { BadgeExtractionError } from '../../types/badges'

/**
 * アサーション URL から Open Badges メタデータ（JSON 文字列）を取得する。
 * CORS エラー・404・ネットワークエラーを種別ごとに分類して投げる。
 */
export async function fetchFromUrl(url: string): Promise<string> {
  let response: Response

  try {
    response = await fetch(url, {
      headers: {
        Accept: 'application/json, application/ld+json, */*',
      },
    })
  } catch (err) {
    // TypeError は CORS ブロックまたはネットワーク不達
    if (err instanceof TypeError) {
      // CORS ブロックの場合、メッセージに "Failed to fetch" が含まれる（Chrome / Firefox）
      const msg = (err as TypeError).message.toLowerCase()
      if (msg.includes('failed to fetch') || msg.includes('networkerror')) {
        throw new BadgeExtractionError(
          `URL の取得に失敗しました。CORS の制限が原因の可能性があります: ${url}`,
          'FETCH_CORS',
        )
      }
    }
    throw new BadgeExtractionError(
      `ネットワークエラーが発生しました: ${url}`,
      'FETCH_NETWORK',
    )
  }

  if (response.status === 404) {
    throw new BadgeExtractionError(
      `指定された URL にアクセスできませんでした (404): ${url}`,
      'FETCH_NOT_FOUND',
    )
  }

  if (!response.ok) {
    throw new BadgeExtractionError(
      `URL の取得に失敗しました (${response.status}): ${url}`,
      'FETCH_NETWORK',
    )
  }

  return response.text()
}
