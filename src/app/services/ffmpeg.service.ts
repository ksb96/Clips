import { Injectable } from '@angular/core';
import { createFFmpeg, fetchFile } from '@ffmpeg/ffmpeg';

@Injectable({
  providedIn: 'root'
})
export class FfmpegService {
  isRunning = false
  isReady = false
  private ffmpeg

  constructor() {
    this.ffmpeg = createFFmpeg({ log: true })
  }

  //load ffmpeg
  async init() {
    if (this.isReady) {
      return
    }
    await this.ffmpeg.load()
    this.isReady = true
  }

  async getScreenshots(file: File) {
    this.isRunning = true

    const data = await fetchFile(file)
    this.ffmpeg.FS('writeFile', file.name, data)

    const seconds = [1, 2, 3]
    const commands: string[] = []

    //process screenshot file+format
    seconds.forEach(second => {
      commands.push(
        // Input
        '-i', file.name, //-i -grab specific file from file system
        // Output Options
        '-ss', `00:00:0${second}`, //ss -configured current timestamp(hh:mm:ss)
        '-frames:v', '1', //24,30,60
        '-filter:v', 'scale=510:-1', //width:height
        // Output
        `output_0${second}.png` //screenshot filename
      )
    })

    await this.ffmpeg.run(...commands)

    const screenshots: string[] = []

    seconds.forEach(second => {
      const screenshotFile = this.ffmpeg.FS('readFile', `output_0${second}.png`)
      //storing binary object data of screenshots-image
      const screenshotBlob = new Blob(
        [screenshotFile.buffer], {
        type: 'image/png'
      })

      //convert to url object(from blob)
      const screenshotURL = URL.createObjectURL(screenshotBlob)

      screenshots.push(screenshotURL)
    })

    this.isRunning = false

    return screenshots
  }

  async blobFromURL(url: string) {
    const response = await fetch(url)
    const blob = await response.blob()

    return blob
  }
}
