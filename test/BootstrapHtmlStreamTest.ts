import * as messages from '@cucumber/messages'
import assert from 'assert'
import { Writable } from 'stream'

import BootstrapHtmlStream from '../src/BootstrapHtmlStream'

async function renderAsHtml(
  ...envelopes: messages.Envelope[]
): Promise<string> {
  return new Promise((resolve, reject) => {
    let html = ''
    const sink: Writable = new Writable({
      write(
        chunk: string,
        _: string,
        callback: (error?: Error | null) => void
      ): void {
        html += chunk
        callback()
      },
    })
    sink.on('finish', () => resolve(html))
    const bootstrapHtmlStream = new BootstrapHtmlStream(
      `${__dirname}/dummy.css`,
      `${__dirname}/dummy.js`
    )
    bootstrapHtmlStream.on('error', reject)
    bootstrapHtmlStream.pipe(sink)

    for (const envelope of envelopes) {
      bootstrapHtmlStream.write(envelope)
    }
    bootstrapHtmlStream.end()
  })
}

describe('BootstrapHtmlStream', () => {
  it('writes zero messages to html', async () => {
    const html = await renderAsHtml()
    assert(html.indexOf('window.CUCUMBER_MESSAGES = []') >= 0)
  })

  it('writes one message to html', async () => {
    const e1: messages.Envelope = {
      testRunStarted: {
        timestamp: { seconds: 0, nanos: 0 },
      },
    }
    const html = await renderAsHtml(e1)
    assert(
      html.indexOf(`window.CUCUMBER_MESSAGES = [${JSON.stringify(e1)}]`) >= 0
    )
  })

  it('writes two messages to html', async () => {
    const e1: messages.Envelope = {
      testRunStarted: {
        timestamp: { seconds: 0, nanos: 0 },
      },
    }
    const e2: messages.Envelope = {
      testRunFinished: {
        timestamp: { seconds: 0, nanos: 0 },
        success: true,
      },
    }
    const html = await renderAsHtml(e1, e2)
    assert(
      html.indexOf(
        `window.CUCUMBER_MESSAGES = [${JSON.stringify(e1)},${JSON.stringify(
          e2
        )}]`
      ) >= 0
    )
  })
})
