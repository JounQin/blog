{% if config.search.path %}
  <script>
    var LOCAL_SEARCH_CONFIG = {
      root: '{{ config.root }}',
      searchPath: '{{ config.search.path }}'
    }
  </script>
  <script src="{{ url_for(theme.js) }}/src/initialize-localsearch.js" defer></script>
{% endif %}
