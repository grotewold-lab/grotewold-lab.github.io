# grotewold-lab.github.io
Grotewold lab website

# Maintenence

## Add News

- add a new .md file to [_posts folder](_posts)

  <details>
  <summary>more details</summary>

  News is handled using [jekyll's blog post system](https://jekyllrb.com/docs/posts/).

  Specifications for news files:
  * Filename must begin with the date in numeric form `YYYY-MM-DD` and must end with `.md`
  * Must have property/value `layout: post`
  * Must have property `title`
  
  <br>

  For example, a news post for November 18th 2022.
  
  filename: `2022-11-18-github-io.md`

  file content: 
  ```
  ---
  layout: post
  title: Website moved to github.io
  ---

  The Grotewold Lab website has moved to github.io!
  ```

  Any content may be added to the bottom of the md file and it will appear on [the corresponding news page](https://grotewold-lab.github.io/2022/11/18/github-io.html).
  
  See the example source file [here](_posts/2022-11-18-github-io.md).

  </details>

## Add Publication

- add a new .md file to [_publications folder](_publications)

  <details>
  <summary>more details</summary>

  Specifications for publication files:
  * Filename must begin with the 4-digit year followed by a hyphen and some identifiable string (first author's name) 
  * Filename must end with `.md`
  * Must have property `pmid`, an 8-digit PMID number assigned by PubMed
  * properties `authors`,`title`,`journal`,`issue` are used to form a citation on [the publications page](https://grotewold-lab.github.io/publications)
  * properties `short_label`,`pdf`,`data`,`scripts` are used to form a row on [the published data and scripts page](https://grotewold-lab.github.io/published-data-and-scripts)
    * `pdf` (optional) url to download pdf
    * `data` (optional) html code to show under "Data" column 
    * `scripts` (optional) html code to show under "Scripts" column
  
  <br>

  For example, a 2021 publication:
  
  filename: `2021-jiang.md`

  file content: 
  ```
  ---
  short_label: "Jiang et al."
  authors: "Jiang N, Dillon FM, Silva A, Gomez-Cano L, Grotewold E"
  title: 'Corrigendum to "Rhamnose in plants - from biosynthesis to diverse functions"'
  journal: "Plant Sci."
  issue: "307:110897"
  pmid: 33902856
  pdf: "https://www.sciencedirect.com/science/article/pii/S016894522100090X/pdfft"
  data: ''
  scripts: ''
  ---
  ```
  See the example source file [here](_publications/2021-jiang.md).

  </details>

## Add Lab Member

- add picture to [assets/images folder](assets/images)
- (optional) add cv to [assets/docs folder](assets/docs)
- add a new .md file to [people folder](people) 
  <details>
  <summary>more details</summary>

  Specifications for people files:
  * Filename must end with `.md`
  * Must have property/value `layout: person`
  * Must have property `permalink`, a string begining with `/` which will form the url for the person's page
  * **Must have property `title` (meaning page title), containing the person's name**
  * Must have property `position`, the job position which will appear on the person's page
    * this can be anything, it doesn't have to match any specific categories
    * this is NOT used to form the categories on [the people page](https://grotewold-lab.github.io/people)
  * Must have property `image`, the filename of an image that exists in [the assets/images folder](assets/images)
  * Must have properties `email` and `phone`
  * (optional) property `cv`, the filename of a file that exists in [the assets/docs folder](assets/docs)
  * (optional) property `mentor` or `mentors`, containing any text which will be shown on the person's page
  
  <br>

  For example, Shannon Schrope:
  
  filename: `shannon-schrope.md`

  file content: 
  ```
  ---
  layout: person
  permalink: /shannon-schrope
  title: Shannon Schrope
  position: SiGuE Fellow
  image: Shannon Schrope.jpeg
  email: schrope2@msu.edu
  phone: (517) 353-6767 
  ---

  *Professional interests and goals:* I am interested in plant biology, and am hoping to pursue a PhD in this field in the near future. My long term goal is to become a professor.

  *General interests:*  I enjoy hiking, biking, playing the piano, swimming, sketching, and crocheting.
  ```
  
  Any content may be added to the bottom of the md file and it will appear on [the person's page](https://grotewold-lab.github.io/shannon-schrope)
  
  See the example source file [here](people/shannon-schrope.md).

  </details>
- add the new .md filename to [_config.yml](_config.yml) under `current_members:` or `current_undergrads:`

## Remove Lab Member

- Locate the relevent line in [_config.yml](_config.yml) under `current_members:` or `current_undergrads:`
- Cut that line and paste it under `former_members:`
