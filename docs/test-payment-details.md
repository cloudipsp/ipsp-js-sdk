---
title: Test Payment Details
headline: Test Payment Details
sort: 6
---

## Merchant parameters

<table class="details">
<colgroup>
    <col>
    <col>
    <col>
</colgroup>
<thead>
    <tr>
           <th>Parameter</th>
           <th>Value</th>
    </tr>
</thead>
<tbody>
    {% for detail in site.data.details.params %}
    <tr>
        <td>{{ detail.name }}</td>
        <td>{{ detail.value }}</td>
    </tr>
    {% endfor %}
</tbody>
</table>


## Test card numbers

<table class="details">
<colgroup>
    <col>
    <col>
    <col>
</colgroup>
<thead>
    <tr>
           <th>Card number</th>
           <th>Expiry date</th>
           <th>CVV2</th>
           <th>3DSecure</th>
           <th>Response type</th>
    </tr>
</thead>
<tbody>
    {% for card in site.data.paymentdetails.cards %}
    <tr>
        <td>{{ card['number'] }}</td>
        <td>{{ card['date'] }}</td>
        <td>{{ card['cvv2'] }}</td>
        <td>{{ card['3ds'] }}</td>
        <td>{{ card['response'] }}</td>
    </tr>
    {% endfor %}
</tbody>
</table>
