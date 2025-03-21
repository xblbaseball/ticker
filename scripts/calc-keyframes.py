# set these
num_stops = 3
percent_time_scrolling = 0.05


percent_time_on_score = 1 - percent_time_scrolling

tick_time = 100 / num_stops
time_per_scrolling = tick_time * percent_time_scrolling
time_per_keyframe = tick_time * percent_time_on_score

# margin_at_end = 100 - (((num_stops + 1) * tick_time) + time_per_keyframe)
# extra_buffer = margin_at_end / num_stops

first = f"""0% {{
  transform: translateY(calc(var(--ticker-height) * 1));
  opacity: 0;
}}
"""
last = f"""100% {{
  transform: translateY(calc(var(--ticker-height) * -{num_stops}));
  opacity: 0;
}}
"""
vals = [first]

last_end = 0
for i in range(0, num_stops):
    start = last_end + time_per_scrolling
    end = start + time_per_keyframe

    last_end = end

    keyframe = f"""{start}%,
{end}% {{
  transform: translateY(calc(var(--ticker-height) * -{i}));
  opacity: 1;
}}
"""

    vals.append(keyframe)

vals.append(last)

print(f"/* generated by calc-keyframes.py */")
print(f"@keyframes vertical-scroll-{num_stops} {{")
print("\n".join(vals).strip())
print("}")
