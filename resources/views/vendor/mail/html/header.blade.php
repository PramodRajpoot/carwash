@props(['url'])
<tr>
<td class="header">
<a href="{{ $url }}" style="display: inline-block;">
<img src="{{ asset('logo.png') }}" class="logo" alt="{{ config('app.name') }} Logo" style="max-height: 60px;">
</a>
</td>
</tr>
