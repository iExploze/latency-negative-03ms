export type CameraStatus = 'idle' | 'requesting' | 'ready' | 'denied' | 'unsupported' | 'error'

export class CameraSystem {
  private stream: MediaStream | null = null
  private readonly video: HTMLVideoElement

  public status: CameraStatus = 'idle'

  public constructor(video: HTMLVideoElement) {
    this.video = video
  }

  public get isReady(): boolean {
    return this.status === 'ready' && this.video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
  }

  public async requestAccess(): Promise<void> {
    if (!navigator.mediaDevices?.getUserMedia) {
      this.status = 'unsupported'
      throw new Error('Browser does not support mirror access.')
    }

    this.status = 'requesting'

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user',
        },
        audio: false,
      })

      this.video.srcObject = this.stream
      this.video.muted = true
      this.video.playsInline = true
      await this.video.play()
      this.status = 'ready'
    } catch (error) {
      this.stop()
      this.status = this.isPermissionError(error) ? 'denied' : 'error'
      throw error
    }
  }

  public stop(): void {
    this.stream?.getTracks().forEach((track) => track.stop())
    this.stream = null
    this.video.pause()
    this.video.srcObject = null
    this.status = 'idle'
  }

  private isPermissionError(error: unknown): boolean {
    return error instanceof DOMException && ['NotAllowedError', 'PermissionDeniedError'].includes(error.name)
  }
}
