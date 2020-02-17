---
title: Getting Started
headline: Getting Started
sort: 2
---

## Quick start

```html
<script src="https://unpkg.com/ipsp-js-sdk"></script>
```

## Basic template

```html
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no">
  </head>
  <body>
    <script src="https://unpkg.com/ipsp-js-sdk"></script>
    <script>
    $checkout('Api').scope(function(){
        this.request('api.checkout.form','request', { Parameters } ).done(function(model){
            model.sendResponse();
            console.log(model.attr('order'));
        }).fail(function(model){
            console.log(model.attr('error'));
        });
    });
    </script>
  </body>
</html>
```

## Parameters

### Host-to-host token

For server-side token generation see [ipsp php sdk](https://ipsp-php.com/) project.

```json
{
  "payment_system":"Supported payment systems: card, p24",
  "token":"host-to-host generated token",
  "card_number":"16/19-digits number",
  "expiry_date":"Supported formats: MM/YY, MM/YYYY, MMYY, MMYYYY",
  "cvv2":"3-digits number"
}
```

### Client-side merchant ID


```json
{
  "payment_system":"Supported payment systems: card, p24",
  "merchant_id":"1396424",
  "currency":"USD",
  "amount":"100.20",
  "card_number":"16/19-digits number",
  "expiry_date":"Supported formats: MM/YY, MM/YYYY, MMYY, MMYYYY",
  "cvv2":"3-digits number"
}
```

optional merchant parameters:


```json
{
  "email":"customer email address",
  "phone":"customer phone number"
}
```