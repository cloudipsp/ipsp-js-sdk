---
sort: 5
---

# Request Parameters

<table class="details">
<colgroup>
    <col>
    <col>
    <col>
    <col>
</colgroup>
<thead>
    <tr>
           <th>Parameter</th>
           <th>Type</th>
           <th>Description</th>
    </tr>
</thead>
<tbody>
    {% for row in site.data.params %}
    <tr class="{% if row[1].mandatory %}mandatory{% endif %}" data-title="{{ row[1].sample }}">
        <td><code class="param">{{ row[0] }}</code></td>
        <td>{{ row[1].type }}</td>
        <td>{{ row[1].descr }}</td>
    </tr>
    {% endfor %}
</tbody>
</table>

