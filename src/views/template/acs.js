const styles = require('./acs_styles')

module.exports = (data) => `
${styles(data)}
<div class="ipsp-modal-wrapper">
    <div class="ipsp-modal">
        <div class="ipsp-modal-header">
            <a href="javascript:void(0)" class="ipsp-modal-close"></a>
            <div class="ipsp-modal-title">
                ${data.messages.modalHeader}
                <a href='javascript:void(0)'>${data.messages.modalLinkLabel}</a>
            </div>
        </div>
        <div class="ipsp-modal-content">
            <iframe src="about:blank" class="ipsp-modal-iframe" frameborder="0" allowtransparency="true"></iframe>
        </div>
    </div>
</div>
`