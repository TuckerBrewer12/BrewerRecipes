do $$
declare
  tucker uuid;
  grandma uuid;
  r uuid;
  i_butter uuid; i_sugar uuid; i_vanilla uuid; i_espresso uuid; i_eggs uuid;
  i_flour uuid; i_cocoa uuid; i_soda uuid; i_salt uuid;
  s3 uuid; s4 uuid; s5 uuid; s6 uuid; s7 uuid;
begin
  insert into members (name, phone, is_admin)
  values ('Tucker', '+15555550100', true)           -- <- your number
  returning id into tucker;

  insert into people (name, member_id) values ('Tucker', tucker);
  insert into people (name) values ('Grandma Brewer') returning id into grandma;

  insert into recipes (title, owner_person_id, uploader_id, category, tags, makes, prep_time, cook_time, search_text)
  values ('Espresso Brownies', grandma, tucker, 'Dessert', '{chocolate,coffee}', 'One 8×8 pan', '15 min', '30–40 min',
          'unsalted butter sugar vanilla extract espresso eggs all-purpose flour cocoa powder baking soda table salt')
  returning id into r;

  insert into ingredients (recipe_id, position, quantity, quantity_text, unit, name, note, original_text) values
    (r, 0, 4,    '4',   'oz',    'unsalted butter',        null, '4 oz (115 g) unsalted butter') returning id into i_butter;
  insert into ingredients (recipe_id, position, quantity, quantity_text, unit, name, note, original_text) values
    (r, 1, 1,    '1',   'cup',   'sugar',                  null, '1 cup (200 g) sugar') returning id into i_sugar;
  insert into ingredients (recipe_id, position, quantity, quantity_text, unit, name, note, original_text) values
    (r, 2, 0.25, '1/4', 'tsp',   'vanilla extract',        null, '1/4 tsp. (2.5 mL) vanilla extract') returning id into i_vanilla;
  insert into ingredients (recipe_id, position, quantity, quantity_text, unit, name, note, original_text) values
    (r, 3, 1,    '1',   'shot',  'espresso',               'or very strong coffee (4 Tbsp)', '1 shot (4 Tbs; 60 mL) fresh brewed espresso or very strong coffee') returning id into i_espresso;
  insert into ingredients (recipe_id, position, quantity, quantity_text, unit, name, note, original_text) values
    (r, 4, 2,    '2',   'large', 'eggs',                   null, '2 large (100 g) eggs') returning id into i_eggs;
  insert into ingredients (recipe_id, position, quantity, quantity_text, unit, name, note, original_text) values
    (r, 5, 0.5,  '1/2', 'cup',   'all-purpose flour',      null, '1/2 cup (80 g) all-purpose flour') returning id into i_flour;
  insert into ingredients (recipe_id, position, quantity, quantity_text, unit, name, note, original_text) values
    (r, 6, 0.333333, '1/3', 'cup', 'Hershey''s cocoa powder', null, '1/3 cup (80 g) Hershey''s cocoa powder') returning id into i_cocoa;
  insert into ingredients (recipe_id, position, quantity, quantity_text, unit, name, note, original_text) values
    (r, 7, 0.25, '1/4', 'tsp',   'baking soda',            null, '1/4 tsp. (1.3 g) baking soda') returning id into i_soda;
  insert into ingredients (recipe_id, position, quantity, quantity_text, unit, name, note, original_text) values
    (r, 8, 0.25, '1/4', 'tsp',   'table salt',             null, '1/4 tsp. (1.5 g) table salt') returning id into i_salt;

  insert into steps (recipe_id, position, text) values (r, 0, 'Butter and flour an 8×8-inch pan.');
  insert into steps (recipe_id, position, text) values (r, 1, 'Preheat the oven to 350°F.');
  insert into steps (recipe_id, position, text) values (r, 2, 'Melt the butter.') returning id into s3;
  insert into steps (recipe_id, position, text) values (r, 3, 'Mix in the sugar, vanilla and espresso.') returning id into s4;
  insert into steps (recipe_id, position, text) values (r, 4, 'Mix in the eggs.') returning id into s5;
  insert into steps (recipe_id, position, text) values (r, 5, 'Fold in the flour, cocoa powder, baking soda and salt.') returning id into s6;
  insert into steps (recipe_id, position, text) values (r, 6, 'Bake for 30 to 40 minutes.') returning id into s7;

  insert into step_inputs (step_id, ingredient_id) values (s3, i_butter);
  insert into step_inputs (step_id, input_step_id) values (s4, s3);
  insert into step_inputs (step_id, ingredient_id) values (s4, i_sugar), (s4, i_vanilla), (s4, i_espresso);
  insert into step_inputs (step_id, input_step_id) values (s5, s4);
  insert into step_inputs (step_id, ingredient_id) values (s5, i_eggs);
  insert into step_inputs (step_id, input_step_id) values (s6, s5);
  insert into step_inputs (step_id, ingredient_id) values (s6, i_flour), (s6, i_cocoa), (s6, i_soda), (s6, i_salt);
  insert into step_inputs (step_id, input_step_id) values (s7, s6);
end $$;
