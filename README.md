# Pied Piper
Pied Pipers is an online application of the popular game (and one of my favourites) 6 Nimmt. This is my first big coding project and you can see and play it online at [piedpiper.mirjamuher.com](http://piedpiper.mirjamuher.com/).

Originally Austrian and (in)voluntary long-term migrant to Australia, I miss sitting around the table to play board and card games with my family. 6 Nimmt has always been a family favourite — that's why I wanted to create a way we could play it together again. I was very excited to finish everything needed to make this project run by Christmas 2020, and was rewarded with hours of play time with my mum and little brother. I hope this game brings you as much joy if you want to play with loved ones far away.

Feedback and questions are more than welcome. Feel free to reach out to me at uher.mirjam@gmail.com.

## Installation
You need to have Python >= 3.6 installed in order to run the code for this project.

Installation is the standard process for a Python project; install the requirements into a virtualenv. Then, you need to run the Flask server.

```bash
$ python -m venv ./venv  # Creates a virtualenv.
$ source ./venv/bin/activate  # Activates the virtualenv.
$ pip install -r requirements.txt  # Intalls the requirements.
$ FLASK_APP=server.py FLASK_ENV=development flask run -h 0.0.0.0  # Runs the flask server in development mode.
```

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.
(Note to self: Update your own tests before anyone reads this and calls you out)

## License
[MIT](https://choosealicense.com/licenses/mit/)
