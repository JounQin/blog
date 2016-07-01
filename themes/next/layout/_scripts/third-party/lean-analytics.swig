{% if theme.leancloud_visitors.enable %}
  {# custom analytics part create by xiamo #}
  <script>
    var LEANCLOUD_VISITORS_CONFIG = {
      appId: '{{ theme.leancloud_visitors.app_id }}',
      appKey: '{{ theme.leancloud_visitors.app_key }}'
    };
  </script>
  <script src="https://cdn1.lncld.net/static/js/av-min-1.0.0.js" defer></script>
  <script src="{{ url_for(theme.js) }}/src/initialize_leancloud.js?v={{ theme.version }}" defer></script>
{% endif %}
