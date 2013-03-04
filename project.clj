(defproject aima-clojure "0.1.0-SNAPSHOT"
  :description "FIXME: write description"
  :url "http://example.com/FIXME"
  :license {:name "Eclipse Public License"
            :url "http://www.eclipse.org/legal/epl-v10.html"}
  :dependencies [[org.clojure/clojure "1.4.0"]
                 [org.clojure/clojurescript "0.0-1450"]]
  :plugins [[lein-cljsbuild "0.3.0"]]
  :source-paths ["src/clj"]             
  :cljsbuild {
              :crossovers [aima-clojure.game aima-clojure.games.tic-tac-toe]
              :crossover-path "crossover-cljs"
              :builds {
                       :dev
                       {:source-paths ["src/cljs"]
                        :compiler {:output-to "public/games.js"
                                   :optimizations :whitespace
                                   :pretty-print true}}
                       }}
  :test-commands
  {"my-test" ["phantomjs" "public/games.js" ""]})