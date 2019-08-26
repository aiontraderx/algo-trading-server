import * as _ from 'underscore'
import * as Telegram from 'node-telegram-bot-api'

import { IAdvice } from '../interfaces'
import BasePlugin from './BasePlugin'
import BaseTrigger from '../triggers/BaseTrigger'
import Plugins from '../database/models/plugins'
import BaseStrategy from 'src/strategies/BaseStrategy';


interface ITelegramOptions {
  chatId?: string
  token: string
}


export default class TelegramPlugin extends BasePlugin<ITelegramOptions> {
  public readonly name = 'Telegram'
  public readonly description = 'Sends notifications to a Telegram bot.'
  public readonly version = 1

  private bot: Telegram


  constructor (pluginDB: Plugins) {
    super(pluginDB)

    this.bot = new Telegram(this.options.token, { polling: { interval: 1000 }})

    if (this.options.chatId) this.send('I\'m now connected to the trading server!')

    this.bot.onText(/(.+)/, this.onText)
  }


  kill () {
    this.bot.stopPolling()
  }


  onTriggerAdvice (trigger: BaseTrigger, advice: IAdvice, price?: number, amount?: number) {
    const message = `${trigger.name} triggered! and adviced to \`${advice}\` ` +
      `on \`${trigger.getExchange().toUpperCase()}\` \`${trigger.getSymbol()}\` with a ` +
      `amount of \`${amount}\`! Current price is \`${price}\``

    this.send(message)
  }


  onStrategyAdvice (strategy: BaseStrategy<{}>, advice: IAdvice, price?: number, amount?: number) {
    const message = `${strategy.name} triggered! and adviced to \`${advice}\` ` +
      `on \`${strategy.getExchange().toUpperCase()}\` \`${strategy.getSymbol()}\` with a ` +
      `amount of \`${amount}\`! Current price is \`${price}\``

    this.send(message)
  }


  onError (error: Error) {
    this.send(`Error: ` + error)
  }


  private send (message: string, _chatId?: string) {
    const chatId = _chatId || this.options.chatId
    if (chatId) this.bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
  }


  private onText = (msg: any, _text: string[]) =>{
    const text = _text[0]
    const chatId = msg.chat.id

    switch (text.toLowerCase()) {
      case '/start':
        this.send(
          `Hello! your chat id is: \`${chatId}\`. Enter the chat id in the CryptoControl ` +
          `terminal to receive all kinds of trading notifications from Iguana.`, chatId
        )
        return

      case '/help':
        this.send(
          `Your chat id is: \`${chatId}\`. \n\nCurrently this bot does support commands :( ` +
          `\n\nEnter the chat id in the CryptoControl terminal to recieve all kinds of trading ` +
          `notifications from Iguana.`,
          chatId
        )
        return
    }

    this.send(`use /help to see a list of commands`, chatId)
  }
}
