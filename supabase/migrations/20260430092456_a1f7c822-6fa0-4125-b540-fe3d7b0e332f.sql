UPDATE public.org_nodes
SET parent_node_id = '2117ea84-643e-5784-a76a-dbdb24050d03',
    sort_order = CASE id
      WHEN 'ebc936e7-9c0e-5c35-b40a-92a1c8fb49ff' THEN 0
      WHEN '4493eca5-13b0-5c6e-b468-238b41744fc3' THEN 1
      WHEN '2a1492f6-5bdc-5963-aae7-90c8ebd3c8f7' THEN 2
      WHEN 'ead1ab7f-9e6a-5c61-b6d5-606fbdb88a07' THEN 3
      WHEN '70f94052-2f1b-5351-9fd6-4d8bd2472ffc' THEN 4
    END
WHERE id IN (
  'ebc936e7-9c0e-5c35-b40a-92a1c8fb49ff',
  '4493eca5-13b0-5c6e-b468-238b41744fc3',
  '2a1492f6-5bdc-5963-aae7-90c8ebd3c8f7',
  'ead1ab7f-9e6a-5c61-b6d5-606fbdb88a07',
  '70f94052-2f1b-5351-9fd6-4d8bd2472ffc'
);

UPDATE public.org_nodes
SET sort_order = 0
WHERE id = '2117ea84-643e-5784-a76a-dbdb24050d03';