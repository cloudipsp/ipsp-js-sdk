const { Module } = require('./module')
const { Connector } = require('./connector')
const { Template } = require('./template')

exports.Modal = Module.extend({
    init(data) {
        this.checkout = data.checkout
        this.model = data.model || {}
        this.messages = data.checkout.params.messages || {}
        this.template = new Template('acs')
        this.body = this.utils.querySelector('body')
        this.initModal()
        this.initConnector()
    },
    initModal() {
        this.name = ['modal-iframe', this.getRandomNumber()].join('-')
        this.modal = this.utils.createElement('div')
        this.modal.innerHTML = this.template.render({
            model: this.model,
            messages: this.messages,
        })
        this.iframe = this.find('.ipsp-modal-iframe')
        this.addAttr(this.iframe, { name: this.name, id: this.name })
        if (this.model['send_data']) {
            this.form = this.prepareForm(
                this.model['url'],
                this.model['send_data'],
                this.name
            )
            this.modal.appendChild(this.form)
        } else {
            this.iframe.src = this.model['url']
        }
        this.addEvent(this.find('.ipsp-modal-close'), 'click', 'closeModal')
        this.addEvent(this.find('.ipsp-modal-title a'), 'click', 'submitForm')
        this.initScrollbar()
        this.body.appendChild(this.modal)
        if (this.form) {
            this.form.submit()
        }
    },
    measureScrollbar() {
        const scrollDiv = document.createElement('div')
        scrollDiv.className = 'modal-scrollbar-measure'
        this.body.appendChild(scrollDiv)
        this.utils.removeElement(scrollDiv)
        return scrollDiv.offsetWidth - scrollDiv.clientWidth
    },
    checkScrollbar() {
        let documentElementRect
        let fullWindowWidth = window.innerWidth
        if (!fullWindowWidth) {
            documentElementRect =
                document.documentElement.getBoundingClientRect()
            fullWindowWidth =
                documentElementRect.right - Math.abs(documentElementRect.left)
        }
        this.bodyIsOverflowing = document.body.clientWidth < fullWindowWidth
        this.scrollbarWidth = this.measureScrollbar()
    },
    initScrollbar() {
        this.checkScrollbar()
        this.bodyPad = parseInt(
            this.utils.getStyle(this.body, 'padding-right') || 0,
            10
        )
        this.originalBodyPad = document.body.style.paddingRight || ''
        this.originalOverflow = document.body.style.overflow || ''
        if (this.bodyIsOverflowing) {
            this.addCss(this.body, {
                paddingRight: [this.bodyPad + this.scrollbarWidth, 'px'].join(
                    ''
                ),
                overflow: 'hidden',
            })
        }
    },
    resetScrollbar() {
        this.addCss(this.body, {
            paddingRight: this.originalBodyPad
                ? [this.originalBodyPad, 'px'].join('')
                : '',
            overflow: this.originalOverflow,
        })
    },
    getRandomNumber() {
        return Math.round(Math.random() * 1000000000)
    },
    find(selector) {
        return this.utils.querySelector(selector, this.modal)
    },
    closeModal(el, ev) {
        ev.preventDefault()
        this.trigger('close', this.data)
        this.removeModal()
    },
    submitForm(el, ev) {
        ev.preventDefault()
        this.trigger('submit', this.data)
        this.addAttr(this.form, {
            target: '_blank',
        })
        this.form.submit()
    },
    removeModal() {
        this.destroy()
    },
    destroy() {
        this.utils.removeElement(this.modal)
        this.resetScrollbar()
        this.connector.destroy()
        this._super()
    },
    initConnector() {
        this.connector = new Connector({ target: this.iframe.contentWindow })
        this.connector.on('response', this.proxy('onResponse'))
    },
    onResponse(ev, data) {
        this.sendResponse(data)
        this.removeModal()
    },
    sendResponse(data) {
        this.checkout.connector.send('request', {
            uid: data.uid,
            action: 'api.checkout.proxy',
            method: 'send',
            params: data,
        })
    },
})
